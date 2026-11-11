// ==================== CONTROLADOR: MENÚ Y CATEGORÍAS ====================
// Consulta y administra categorías y platillos con consultas parametrizadas.
const { getPool, sql } = require('../config/db');
const HttpError = require('../utils/httpError');
const { registrarAuditoria } = require('../utils/audit');

async function listDishes(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request().query(`
    SELECT p.id_platillo, p.nombre, p.descripcion, p.precio, p.id_categoria,
           p.disponible, c.nombre AS categoria
    FROM dbo.platillos AS p
    INNER JOIN dbo.categorias_menu AS c ON c.id_categoria = p.id_categoria
    ORDER BY c.nombre, p.nombre;
  `);
  return respuesta.json({ platillos: resultado.recordset });
}

async function listCategories(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request().query(`
    SELECT id_categoria, nombre, 1 AS activa
    FROM dbo.categorias_menu
    ORDER BY nombre;
  `);
  return respuesta.json({ categorias: resultado.recordset });
}

function validarPlatillo(datos) {
  const idCategoria = Number(datos.id_categoria);
  const precio = Number(datos.precio);
  if (typeof datos.nombre !== 'string' || !datos.nombre.trim() ||
      !Number.isInteger(idCategoria) || !Number.isFinite(precio) || precio < 0) {
    throw new HttpError(400, 'Revise el nombre, la categoría y el precio del platillo.');
  }
  return {
    nombre: datos.nombre.trim(),
    descripcion: typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '',
    idCategoria,
    precio
  };
}

async function createDish(solicitud, respuesta) {
  const datos = validarPlatillo(solicitud.body || {});
  const pool = await getPool();
  const resultado = await pool.request()
    .input('nombre', sql.NVarChar(120), datos.nombre)
    .input('descripcion', sql.NVarChar(400), datos.descripcion)
    .input('precio', sql.Decimal(10, 2), datos.precio)
    .input('idCategoria', sql.Int, datos.idCategoria)
    .query(`
      INSERT INTO dbo.platillos (nombre, descripcion, precio, id_categoria, disponible)
      OUTPUT INSERTED.id_platillo
      VALUES (@nombre, @descripcion, @precio, @idCategoria, 1);
    `);
  await registrarAuditoria(solicitud.usuario.id_empleado, `Alta de platillo: ${datos.nombre}`);
  return respuesta.status(201).json({ mensaje: 'Platillo creado correctamente.', id_platillo: resultado.recordset[0].id_platillo });
}

async function updateDish(solicitud, respuesta) {
  const id = Number(solicitud.params.id);
  const datos = validarPlatillo(solicitud.body || {});
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'El platillo indicado no es válido.');
  const pool = await getPool();
  const resultado = await pool.request()
    .input('id', sql.Int, id)
    .input('nombre', sql.NVarChar(120), datos.nombre)
    .input('descripcion', sql.NVarChar(400), datos.descripcion)
    .input('precio', sql.Decimal(10, 2), datos.precio)
    .input('idCategoria', sql.Int, datos.idCategoria)
    .query(`
      UPDATE dbo.platillos
      SET nombre = @nombre, descripcion = @descripcion, precio = @precio, id_categoria = @idCategoria
      WHERE id_platillo = @id;
    `);
  if (!resultado.rowsAffected[0]) throw new HttpError(404, 'No se encontró el platillo.');
  await registrarAuditoria(solicitud.usuario.id_empleado, `Edición de platillo: ${datos.nombre}`);
  return respuesta.json({ mensaje: 'Platillo actualizado correctamente.' });
}

async function toggleDish(solicitud, respuesta) {
  const id = Number(solicitud.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'El platillo indicado no es válido.');
  const pool = await getPool();
  const resultado = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE dbo.platillos
      SET disponible = CASE WHEN disponible = 1 THEN 0 ELSE 1 END
      OUTPUT INSERTED.disponible
      WHERE id_platillo = @id;
    `);
  if (!resultado.recordset.length) throw new HttpError(404, 'No se encontró el platillo.');
  await registrarAuditoria(solicitud.usuario.id_empleado, `Cambio de disponibilidad del platillo ${id}`);
  return respuesta.json({ mensaje: 'Disponibilidad actualizada.', disponible: resultado.recordset[0].disponible });
}

async function createCategory(solicitud, respuesta) {
  const nombre = typeof solicitud.body?.nombre === 'string' ? solicitud.body.nombre.trim() : '';
  if (!nombre) throw new HttpError(400, 'Escriba el nombre de la categoría.');
  const pool = await getPool();
  const resultado = await pool.request()
    .input('nombre', sql.NVarChar(80), nombre)
    .query(`
      INSERT INTO dbo.categorias_menu (nombre)
      OUTPUT INSERTED.id_categoria
      VALUES (@nombre);
    `);
  await registrarAuditoria(solicitud.usuario.id_empleado, `Alta de categoría: ${nombre}`);
  return respuesta.status(201).json({ mensaje: 'Categoría creada correctamente.', id_categoria: resultado.recordset[0].id_categoria });
}

async function updateCategory(solicitud, respuesta) {
  const id = Number(solicitud.params.id);
  const nombre = typeof solicitud.body?.nombre === 'string' ? solicitud.body.nombre.trim() : '';
  if (!Number.isInteger(id) || id < 1 || !nombre) throw new HttpError(400, 'Revise el nombre de la categoría.');
  const pool = await getPool();
  const resultado = await pool.request()
    .input('id', sql.Int, id)
    .input('nombre', sql.NVarChar(80), nombre)
    .query('UPDATE dbo.categorias_menu SET nombre = @nombre WHERE id_categoria = @id;');
  if (!resultado.rowsAffected[0]) throw new HttpError(404, 'No se encontró la categoría.');
  await registrarAuditoria(solicitud.usuario.id_empleado, `Edición de categoría: ${nombre}`);
  return respuesta.json({ mensaje: 'Categoría actualizada correctamente.' });
}

async function toggleCategory(solicitud, respuesta) {
  const id = Number(solicitud.params.id);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'La categoría indicada no es válida.');
  return respuesta.json({ mensaje: 'Operación no requerida por el esquema actual.', activa: 1 });
}

module.exports = {
  listDishes,
  listCategories,
  createDish,
  updateDish,
  toggleDish,
  createCategory,
  updateCategory,
  toggleCategory
};