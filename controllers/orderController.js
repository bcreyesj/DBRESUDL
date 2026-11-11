// ==================== CONTROLADOR: ÓRDENES, COMANDAS Y COBROS ====================
// Protege cambios de estado y cálculos monetarios con validación y transacciones SQL.
const { getPool, sql } = require('../config/db');
const HttpError = require('../utils/httpError');
const { registrarAuditoria } = require('../utils/audit');

const ESTADOS_ORDEN = ['Pendiente', 'En preparacion', 'Listo', 'Entregado', 'Pagado', 'Cancelado'];
const SIGUIENTE_ESTADO = new Map([
  ['Pendiente', 'En preparacion'],
  ['En preparacion', 'Listo'],
  ['Listo', 'Entregado']
]);

function agruparOrdenes(registros) {
  const ordenes = new Map();
  for (const fila of registros) {
    if (!ordenes.has(fila.id_orden)) {
      ordenes.set(fila.id_orden, {
        id_orden: fila.id_orden,
        id_mesa: fila.id_mesa,
        numero_mesa: fila.numero_mesa,
        empleado: fila.empleado,
        estado: fila.estado,
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
      SELECT TOP (100) o.id_orden, o.id_mesa, m.numero_mesa, e.nombre AS empleado,
             o.estado, o.fecha_hora, o.total,
             d.id_detalle, d.id_platillo, p.nombre AS platillo, d.cantidad,
             d.precio_unitario, d.subtotal
      FROM dbo.ordenes AS o
      INNER JOIN dbo.mesas AS m ON m.id_mesa = o.id_mesa
      INNER JOIN dbo.empleados AS e ON e.id_empleado = o.id_empleado
      LEFT JOIN dbo.detalle_ordenes AS d ON d.id_orden = o.id_orden
      LEFT JOIN dbo.platillos AS p ON p.id_platillo = d.id_platillo
      WHERE o.estado NOT IN (N'Pagado', N'Cancelado')
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
    if (mesa.recordset[0].estado === 'Limpieza') throw new HttpError(409, 'La mesa está en limpieza y no puede recibir una comanda.');

    const ordenActiva = await new sql.Request(transaction)
      .input('mesaId', sql.Int, mesaId)
      .query(`
        SELECT TOP (1) id_orden, estado
        FROM dbo.ordenes WITH (UPDLOCK, HOLDLOCK)
        WHERE id_mesa = @mesaId AND estado NOT IN (N'Pagado', N'Cancelado')
        ORDER BY fecha_hora DESC;
      `);
    if (ordenActiva.recordset.length) {
      if (!['Pendiente', 'En preparacion'].includes(ordenActiva.recordset[0].estado)) {
        throw new HttpError(409, 'La comanda ya avanzó en cocina y no admite nuevos platillos.');
      }
      orderId = ordenActiva.recordset[0].id_orden;
    } else {
      const nuevaOrden = await new sql.Request(transaction)
        .input('mesaId', sql.Int, mesaId)
        .input('empleadoId', sql.Int, solicitud.usuario.id_empleado)
        .query(`
          INSERT INTO dbo.ordenes (id_mesa, id_empleado, estado, total)
          OUTPUT INSERTED.id_orden
          VALUES (@mesaId, @empleadoId, N'Pendiente', 0);
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
        .input('cantidad', sql.SmallInt, cantidad)
        .input('precio', sql.Decimal(10, 2), precio)
        .input('subtotal', sql.Decimal(12, 2), Number(precio) * cantidad)
        .query(`
          INSERT INTO dbo.detalle_ordenes (id_orden, id_platillo, cantidad, precio_unitario, subtotal)
          VALUES (@orderId, @dishId, @cantidad, @precio, @subtotal);
        `);
    }

    await new sql.Request(transaction)
      .input('orderId', sql.Int, orderId)
      .input('mesaId', sql.Int, mesaId)
      .query(`
        UPDATE dbo.ordenes
        SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM dbo.detalle_ordenes WHERE id_orden = @orderId)
        WHERE id_orden = @orderId;
        UPDATE dbo.mesas SET estado = N'Ocupada' WHERE id_mesa = @mesaId;
      `);
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
  const estado = solicitud.body?.estado;
  if (!Number.isInteger(orderId) || orderId < 1 || !ESTADOS_ORDEN.includes(estado)) {
    throw new HttpError(400, 'Seleccione un estado válido para la comanda.');
  }
  if (estado === 'Pagado' || estado === 'Cancelado') {
    throw new HttpError(400, 'El pago se registra en el flujo de cobro de la orden.');
  }

  const pool = await getPool();
  const actual = await pool.request()
    .input('id', sql.Int, orderId)
    .query('SELECT estado FROM dbo.ordenes WHERE id_orden = @id;');
  if (!actual.recordset.length) throw new HttpError(404, 'No se encontró la comanda.');
  if (SIGUIENTE_ESTADO.get(actual.recordset[0].estado) !== estado) {
    throw new HttpError(409, 'Avance la comanda al siguiente estado disponible.');
  }
  const resultado = await pool.request()
    .input('id', sql.Int, orderId)
    .input('estado', sql.NVarChar(24), estado)
    .input('estadoAnterior', sql.NVarChar(24), actual.recordset[0].estado)
    .query(`
      UPDATE dbo.ordenes SET estado = @estado
      WHERE id_orden = @id AND estado = @estadoAnterior;
    `);
  if (!resultado.rowsAffected[0]) throw new HttpError(409, 'La comanda cambió. Actualice la lista e intente nuevamente.');
  await registrarAuditoria(solicitud.usuario.id_empleado, `Comanda ${orderId}: estado ${estado}`);
  return respuesta.json({ mensaje: 'Estado de la comanda actualizado.' });
}

async function payOrder(solicitud, respuesta) {
  const orderId = Number(solicitud.params.id);
  const paymentMethodId = Number(solicitud.body?.id_metodo_pago);
  if (!Number.isInteger(orderId) || orderId < 1 ||
      !Number.isInteger(paymentMethodId) || paymentMethodId < 1) {
    throw new HttpError(400, 'Seleccione un método de pago válido.');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  let mesaId;
  try {
    const orden = await new sql.Request(transaction)
      .input('id', sql.Int, orderId)
      .query('SELECT id_mesa, estado, total FROM dbo.ordenes WITH (UPDLOCK, HOLDLOCK) WHERE id_orden = @id;');
    if (!orden.recordset.length) throw new HttpError(404, 'No se encontró la comanda.');
    if (orden.recordset[0].estado !== 'Entregado') {
      throw new HttpError(409, 'La comanda debe estar entregada antes de registrar el pago.');
    }
    const metodo = await new sql.Request(transaction)
      .input('id', sql.Int, paymentMethodId)
      .query('SELECT id_metodo_pago FROM dbo.metodos_pago WHERE id_metodo_pago = @id AND activo = 1;');
    if (!metodo.recordset.length) throw new HttpError(400, 'El método de pago seleccionado no está disponible.');

    mesaId = orden.recordset[0].id_mesa;
    await new sql.Request(transaction)
      .input('orderId', sql.Int, orderId)
      .input('methodId', sql.Int, paymentMethodId)
      .input('amount', sql.Decimal(12, 2), orden.recordset[0].total)
      .input('mesaId', sql.Int, mesaId)
      .query(`
        INSERT INTO dbo.pagos (id_orden, id_metodo_pago, monto)
        VALUES (@orderId, @methodId, @amount);
        UPDATE dbo.ordenes SET estado = N'Pagado' WHERE id_orden = @orderId;
        UPDATE dbo.mesas SET estado = N'Limpieza' WHERE id_mesa = @mesaId;
      `);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await registrarAuditoria(solicitud.usuario.id_empleado, `Cobro registrado para la comanda ${orderId}`);
  return respuesta.json({ mensaje: 'Pago registrado. La mesa pasó a limpieza.' });
}

module.exports = { listOrders, createOrder, updateOrderState, payOrder };
