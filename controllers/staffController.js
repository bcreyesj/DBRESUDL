// ==================== CONTROLADOR: PERSONAL ====================
// Administra empleados, roles y estado; las contraseñas nuevas siempre se guardan con bcrypt.
const bcrypt = require('bcrypt');
const { getPool, sql } = require('../config/db');
const HttpError = require('../utils/httpError');
const { registrarAuditoria } = require('../utils/audit');

async function listStaff(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request().query(`
    SELECT id_empleado, nombre, usuario, rol_id, estado, fecha_creacion
    FROM dbo.empleados
    ORDER BY nombre;
  `);
  return respuesta.json({ empleados: resultado.recordset });
}

async function createStaff(solicitud, respuesta) {
  const { nombre, usuario, contrasena, rol_id: rolId } = solicitud.body || {};
  const rol = Number(rolId);
  if (typeof nombre !== 'string' || !nombre.trim() ||
      typeof usuario !== 'string' || !usuario.trim() ||
      typeof contrasena !== 'string' || contrasena.length < 10 ||
      ![1, 2].includes(rol)) {
    throw new HttpError(400, 'Indique nombre, usuario, rol y una contraseña de al menos 10 caracteres.');
  }

  const hash = await bcrypt.hash(contrasena, 12);
  const pool = await getPool();
  const resultado = await pool.request()
    .input('nombre', sql.NVarChar(120), nombre.trim())
    .input('usuario', sql.NVarChar(60), usuario.trim())
    .input('hash', sql.NVarChar(100), hash)
    .input('rol', sql.TinyInt, rol)
    .query(`
      INSERT INTO dbo.empleados (nombre, usuario, contrasena_hash, rol_id, estado)
      OUTPUT INSERTED.id_empleado
      VALUES (@nombre, @usuario, @hash, @rol, 1);
    `);
  await registrarAuditoria(solicitud.usuario.id_empleado, `Alta de personal: ${usuario.trim()}`);
  return respuesta.status(201).json({ mensaje: 'Empleado registrado correctamente.', id_empleado: resultado.recordset[0].id_empleado });
}

async function updateStaff(solicitud, respuesta) {
  const id = Number(solicitud.params.id);
  const { nombre, usuario, contrasena, rol_id: rolId, estado } = solicitud.body || {};
  const rol = Number(rolId);
  if (!Number.isInteger(id) || id < 1 ||
      typeof nombre !== 'string' || !nombre.trim() ||
      typeof usuario !== 'string' || !usuario.trim() ||
      ![1, 2].includes(rol) || ![true, false, 0, 1].includes(estado)) {
    throw new HttpError(400, 'Revise los datos del empleado y su estado.');
  }
  if (id === Number(solicitud.usuario.id_empleado) && (rol !== 1 || !Boolean(estado))) {
    throw new HttpError(400, 'No puede cambiar su propio rol ni desactivar su cuenta.');
  }

  const pool = await getPool();
  const actual = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT id_empleado, rol_id, estado FROM dbo.empleados WHERE id_empleado = @id;');
  if (!actual.recordset.length) throw new HttpError(404, 'No se encontró el empleado.');
  if (Number(actual.recordset[0].rol_id) === 1 && actual.recordset[0].estado && (rol !== 1 || !Boolean(estado))) {
    const administradores = await pool.request().query(`
      SELECT COUNT(*) AS cantidad
      FROM dbo.empleados
      WHERE rol_id = 1 AND estado = 1;
    `);
    if (administradores.recordset[0].cantidad <= 1) {
      throw new HttpError(409, 'El sistema debe conservar al menos una cuenta de administrador activa.');
    }
  }

  const hash = typeof contrasena === 'string' && contrasena.length
    ? await bcrypt.hash(contrasena, 12)
    : null;
  await pool.request()
    .input('id', sql.Int, id)
    .input('nombre', sql.NVarChar(120), nombre.trim())
    .input('usuario', sql.NVarChar(60), usuario.trim())
    .input('rol', sql.TinyInt, rol)
    .input('estado', sql.Bit, Boolean(estado))
    .input('hash', sql.NVarChar(100), hash)
    .query(`
      UPDATE dbo.empleados
      SET nombre = @nombre,
          usuario = @usuario,
          rol_id = @rol,
          estado = @estado,
          contrasena_hash = COALESCE(@hash, contrasena_hash)
      WHERE id_empleado = @id;
    `);
  await registrarAuditoria(solicitud.usuario.id_empleado, `Edición de personal: ${usuario.trim()}`);
  return respuesta.json({ mensaje: 'Empleado actualizado correctamente.' });
}

module.exports = { listStaff, createStaff, updateStaff };
