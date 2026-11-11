// ==================== CONTROLADOR: ÓRDENES, COMANDAS Y COBROS ====================
const { getPool, sql } = require('../config/db');
const HttpError = require('../utils/httpError');
const { registrarAuditoria } = require('../utils/audit');

const ESTADOS_ORDEN = ['Pendiente', 'En preparacion', 'Listo', 'Entregado', 'Pagada', 'Cancelada'];

// Mapeo de DB -> Frontend
function mapearEstadoFrontend(estadoDb) {
  if (estadoDb === 'En Proceso') return 'Pendiente';
  if (estadoDb === 'Servida') return 'Entregado';
  return estadoDb || 'Pendiente';
}

// Mapeo de Frontend -> DB
function mapearEstadoDb(estadoFrontend) {
  if (estadoFrontend === 'Pendiente' || estadoFrontend === 'En preparacion') return 'En Proceso';
  if (estadoFrontend === 'Listo' || estadoFrontend === 'Entregado') return 'Servida';
  return estadoFrontend;
}

function agruparOrdenes(registros) {
  const ordenes = new Map();
  for (const fila of registros) {
    if (!ordenes.has(fila.id_orden)) {
      ordenes.set(fila.id_orden, {
        id_orden: fila.id_orden,
        id_mesa: fila.id_mesa,
        numero_mesa: fila.numero_mesa,
        empleado: fila.empleado,
        estado: mapearEstadoFrontend(fila.estado),
        fecha_hora: fila.fecha_hora,
        total: fila.total,
        articulos: []
      });
    }
    if (fila.id_detalle) {
      ordenes.get(fila.id_orden).articulos.push({
        id_detalle: fila.id_detalle,
        id_platillo: fila.id_platillo,
        nombre: fila.platillo,
        cantidad: fila.cantidad,
        precio_unitario: fila.precio_unitario,
        subtotal: fila.subtotal
      });
    }
  }
  return [...ordenes.values()];
}

async function listOrders(solicitud, respuesta) {
  const mesaId = solicitud.query.mesaId ? Number(solicitud.query.mesaId) : null;
  if (mesaId !== null && (!Number.isInteger(mesaId) || mesaId < 1)) {
    throw new HttpError(400, 'La mesa indicada no es válida.');
  }
  const pool = await getPool();
  const resultado = await pool.request()
    .input('mesaId', sql.Int, mesaId)
    .query(`
      SELECT TOP (100) 
             o.id_orden, o.id_mesa, m.numero_mesa, e.nombre AS empleado,
             o.estado, o.fecha_hora, 
             COALESCE(totales.total_calculado, 0) AS total,
             d.id_detalle, d.id_platillo, pl.nombre AS platillo, d.cantidad,
             d.precio_unitario, d.subtotal
      FROM dbo.ordenes AS o
      INNER JOIN dbo.mesas AS m ON m.id_mesa = o.id_mesa
      INNER JOIN dbo.empleados AS e ON e.id_empleado = o.id_mesero
      LEFT JOIN (
        SELECT id_orden, SUM(subtotal) AS total_calculado
        FROM dbo.detalle_ordenes
        GROUP BY id_orden
      ) AS totales ON totales.id_orden = o.id_orden
      LEFT JOIN dbo.detalle_ordenes AS d ON d.id_orden = o.id_orden
      LEFT JOIN dbo.platillos AS pl ON pl.id_platillo = d.id_platillo
      WHERE o.estado NOT IN (N'Pagada', N'Cancelada')
        AND (@mesaId IS NULL OR o.id_mesa = @mesaId)
      ORDER BY o.fecha_hora DESC, d.id_detalle;
    `);
  return respuesta.json({ ordenes: agruparOrdenes(resultado.recordset) });
}

async function createOrder(solicitud, respuesta) {
  const mesaId = Number(solicitud.body?.id_mesa);
  const articulos = solicitud.body?.articulos;
  if (!Number.isInteger(mesaId) || mesaId < 1 || !Array.isArray(articulos) ||
      articulos.length < 1 || articulos.length > 50) {
    throw new HttpError(400, 'Seleccione una mesa y agregue al menos un platillo.');
  }
  const cantidades = new Map();
  for (const articulo of articulos) {
    const id = Number(articulo.id_platillo);
    const cantidad = Number(articulo.cantidad);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      throw new HttpError(400, 'Revise los platillos y las cantidades de la comanda.');
    }
    cantidades.set(id, (cantidades.get(id) || 0) + cantidad);
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let orderId;
  try {
    const mesa = await new sql.Request(transaction)
      .input('mesaId', sql.Int, mesaId)
      .query(`
        SELECT id_mesa, estado
        FROM dbo.mesas WITH (UPDLOCK, HOLDLOCK)
        WHERE id_mesa = @mesaId;
      `);
    if (!mesa.recordset.length) throw new HttpError(404, 'No se encontró la mesa seleccionada.');

    const ordenActiva = await new sql.Request(transaction)
      .input('mesaId', sql.Int, mesaId)
      .query(`
        SELECT TOP (1) id_orden, estado
        FROM dbo.ordenes WITH (UPDLOCK, HOLDLOCK)
        WHERE id_mesa = @mesaId AND estado NOT IN (N'Pagada', N'Cancelada')
        ORDER BY fecha_hora DESC;
      `);
    if (ordenActiva.recordset.length) {
      orderId = ordenActiva.recordset[0].id_orden;
    } else {
      const nuevaOrden = await new sql.Request(transaction)
        .input('mesaId', sql.Int, mesaId)
        .input('meseroId', sql.Int, solicitud.usuario.id_empleado || 1)
        .query(`
          DECLARE @InsertedIds TABLE (id_orden INT);

          INSERT INTO dbo.ordenes (id_mesa, id_mesero, estado)
          OUTPUT INSERTED.id_orden INTO @InsertedIds
          VALUES (@mesaId, @meseroId, N'En Proceso');

          SELECT id_orden FROM @InsertedIds;
        `);
      orderId = nuevaOrden.recordset[0].id_orden;
    }

    for (const [dishId, cantidad] of cantidades) {
      const platillo = await new sql.Request(transaction)
        .input('dishId', sql.Int, dishId)
        .query('SELECT nombre, precio FROM dbo.platillos WHERE id_platillo = @dishId AND disponible = 1;');
      if (!platillo.recordset.length) {
        throw new HttpError(409, 'Uno de los platillos ya no está disponible. Actualice el menú.');
      }
      const precio = platillo.recordset[0].precio;
      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .input('dishId', sql.Int, dishId)
        .input('cantidad', sql.Int, cantidad)
        .input('precio', sql.Decimal(10, 2), precio)
        .query(`
          INSERT INTO dbo.detalle_ordenes (id_orden, id_platillo, cantidad, precio_unitario)
          VALUES (@orderId, @dishId, @cantidad, @precio);
        `);
    }

    await new sql.Request(transaction)
      .input('mesaId', sql.Int, mesaId)
      .query(`UPDATE dbo.mesas SET estado = N'Ocupada' WHERE id_mesa = @mesaId;`);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await registrarAuditoria(solicitud.usuario.id_empleado, `Comanda ${orderId} enviada a cocina para la mesa ${mesaId}`);
  return respuesta.status(201).json({ mensaje: 'Comanda enviada a cocina.', id_orden: orderId });
}

async function updateOrderState(solicitud, respuesta) {
  const orderId = Number(solicitud.params.id);
  const estadoFrontend = solicitud.body?.estado;
  if (!Number.isInteger(orderId) || orderId < 1 || !ESTADOS_ORDEN.includes(estadoFrontend)) {
    throw new HttpError(400, 'Seleccione un estado válido para la comanda.');
  }

  const estadoDb = mapearEstadoDb(estadoFrontend);

  const pool = await getPool();
  const resultado = await pool.request()
    .input('id', sql.Int, orderId)
    .input('estado', sql.VarChar(20), estadoDb)
    .query(`UPDATE dbo.ordenes SET estado = @estado WHERE id_orden = @id;`);
  if (!resultado.rowsAffected[0]) throw new HttpError(404, 'No se encontró la comanda.');
  await registrarAuditoria(solicitud.usuario.id_empleado, `Comanda ${orderId}: estado ${estadoFrontend}`);
  return respuesta.json({ mensaje: `Comanda #${orderId} actualizada a: ${estadoFrontend}.` });
}

async function payOrder(solicitud, respuesta) {
  const orderId = Number(solicitud.params.id);
  const paymentMethodId = Number(solicitud.body?.id_metodo_pago);
  if (!Number.isInteger(orderId) || orderId < 1 ||
      !Number.isInteger(paymentMethodId) || paymentMethodId < 1) {
    throw new HttpError(400, 'Seleccione un método de pago válido.');
  }

  const pool = await getPool();
  const orden = await pool.request()
    .input('id', sql.Int, orderId)
    .query(`
      SELECT o.id_orden, ISNULL(SUM(d.subtotal), 0) AS total 
      FROM dbo.ordenes o
      LEFT JOIN dbo.detalle_ordenes d ON o.id_orden = d.id_orden
      WHERE o.id_orden = @id
      GROUP BY o.id_orden;
    `);

  if (!orden.recordset.length) throw new HttpError(404, 'No se encontró la comanda.');
  const total = orden.recordset[0].total;

  await pool.request()
    .input('orderId', sql.Int, orderId)
    .input('methodId', sql.Int, paymentMethodId)
    .input('monto', sql.Decimal(10, 2), total)
    .execute('sp_ProcesarPagoTransaccion');

  await registrarAuditoria(solicitud.usuario.id_empleado, `Cobro registrado para la comanda ${orderId}`);
  return respuesta.json({ mensaje: 'Pago registrado exitosamente.' });
}

module.exports = { listOrders, createOrder, updateOrderState, payOrder };