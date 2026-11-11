// ==================== CONTROLADOR: INVENTARIO Y RECETAS ====================
// Administra existencias y relaciones de ingredientes con platillos.
const { getPool, sql } = require('../config/db');
const HttpError = require('../utils/httpError');
const { registrarAuditoria } = require('../utils/audit');

async function listIngredients(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request().query(`
    SELECT id_ingrediente, nombre, stock_actual, stock_minimo, unidad_medida,
           CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END AS bajo_minimo
    FROM dbo.ingredientes
    ORDER BY CASE WHEN stock_actual <= stock_minimo THEN 0 ELSE 1 END, nombre;
  `);
  return respuesta.json({ ingredientes: resultado.recordset });
}

async function updateIngredient(solicitud, respuesta) {
  const id = Number(solicitud.params.id);
  const stockActual = Number(solicitud.body?.stock_actual);
  const stockMinimo = Number(solicitud.body?.stock_minimo);
  if (!Number.isInteger(id) || id < 1 ||
      !Number.isFinite(stockActual) || stockActual < 0 ||
      !Number.isFinite(stockMinimo) || stockMinimo < 0) {
    throw new HttpError(400, 'Indique existencias y mínimo válidos, sin valores negativos.');
  }
  const pool = await getPool();
  const resultado = await pool.request()
    .input('id', sql.Int, id)
    .input('stock', sql.Decimal(12, 3), stockActual)
    .input('minimo', sql.Decimal(12, 3), stockMinimo)
    .query(`
      UPDATE dbo.ingredientes
      SET stock_actual = @stock, stock_minimo = @minimo
      WHERE id_ingrediente = @id;
    `);
  if (!resultado.rowsAffected[0]) throw new HttpError(404, 'No se encontró el ingrediente.');
  await registrarAuditoria(solicitud.usuario.id_empleado, `Actualización de inventario: ingrediente ${id}`);
  return respuesta.json({ mensaje: 'Existencias actualizadas correctamente.' });
}

async function getRecipe(solicitud, respuesta) {
  const dishId = Number(solicitud.params.dishId);
  if (!Number.isInteger(dishId) || dishId < 1) throw new HttpError(400, 'El platillo indicado no es válido.');
  const pool = await getPool();
  const resultado = await pool.request()
    .input('dishId', sql.Int, dishId)
    .query(`
      SELECT r.id_ingrediente, i.nombre, r.cantidad_requerida, i.unidad_medida
      FROM dbo.recetas AS r
      INNER JOIN dbo.ingredientes AS i ON i.id_ingrediente = r.id_ingrediente
      WHERE r.id_platillo = @dishId
      ORDER BY i.nombre;
    `);
  return respuesta.json({ receta: resultado.recordset });
}

async function saveRecipe(solicitud, respuesta) {
  const dishId = Number(solicitud.params.dishId);
  const receta = solicitud.body?.ingredientes;
  if (!Number.isInteger(dishId) || dishId < 1 || !Array.isArray(receta) || receta.length > 100) {
    throw new HttpError(400, 'La receta no tiene un formato válido.');
  }
  const lineas = receta.map((linea) => ({
    id: Number(linea.id_ingrediente),
    cantidad: Number(linea.cantidad_requerida)
  }));
  if (lineas.some((linea) => !Number.isInteger(linea.id) || linea.id < 1 ||
      !Number.isFinite(linea.cantidad) || linea.cantidad <= 0) ||
      new Set(lineas.map((linea) => linea.id)).size !== lineas.length) {
    throw new HttpError(400, 'Cada ingrediente debe ser único y tener una cantidad mayor que cero.');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const platillo = await new sql.Request(transaction)
      .input('dishId', sql.Int, dishId)
      .query('SELECT id_platillo FROM dbo.platillos WITH (UPDLOCK, HOLDLOCK) WHERE id_platillo = @dishId;');
    if (!platillo.recordset.length) throw new HttpError(404, 'No se encontró el platillo.');

    if (lineas.length) {
      const parametros = lineas.map((linea, indice) => ({ nombre: `ingrediente${indice}`, id: linea.id }));
      const listaParametros = parametros.map((parametro) => `@${parametro.nombre}`).join(', ');
      const solicitudIngredientes = new sql.Request(transaction);
      parametros.forEach((parametro) => solicitudIngredientes.input(parametro.nombre, sql.Int, parametro.id));
      const resultadoIngredientes = await solicitudIngredientes.query(`
        SELECT COUNT(*) AS cantidad
        FROM dbo.ingredientes
        WHERE id_ingrediente IN (${listaParametros});
      `);
      if (resultadoIngredientes.recordset[0].cantidad !== lineas.length) {
        throw new HttpError(400, 'La receta contiene un ingrediente que no existe.');
      }
    }

    await new sql.Request(transaction)
      .input('dishId', sql.Int, dishId)
      .query('DELETE FROM dbo.recetas WHERE id_platillo = @dishId;');
    for (const linea of lineas) {
      await new sql.Request(transaction)
        .input('dishId', sql.Int, dishId)
        .input('ingredientId', sql.Int, linea.id)
        .input('quantity', sql.Decimal(12, 3), linea.cantidad)
        .query(`
          INSERT INTO dbo.recetas (id_platillo, id_ingrediente, cantidad_requerida)
          VALUES (@dishId, @ingredientId, @quantity);
        `);
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  await registrarAuditoria(solicitud.usuario.id_empleado, `Actualización de receta del platillo ${dishId}`);
  return respuesta.json({ mensaje: 'Receta guardada correctamente.' });
}

module.exports = { listIngredients, updateIngredient, getRecipe, saveRecipe };
