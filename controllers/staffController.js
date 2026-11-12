// ==================== CONTROLADOR: PERSONAL ====================
// Administra empleados y usuarios vinculados en la base de datos.
const bcrypt = require('bcrypt');
const { getPool, sql } = require('../config/db');
const HttpError = require('../utils/httpError');
const { registrarAuditoria } = require('../utils/audit');

async function listStaff(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request().query(`
    SELECT u.id_usuario AS id_empleado, e.nombre, u.usuario, u.rol_id, u.activo AS estado, u.fecha_creacion
    FROM dbo.usuarios u
    LEFT JOIN dbo.empleados e ON u.id_empleado = e.id_empleado
    ORDER BY e.nombre;
  `);
  return respuesta.json({ empleados: resultado.recordset });
}

async function createStaff(solicitud, respuesta) {
  const { nombre, usuario, contrasena, rol_id: rolId } = solicitud.body || {};
  const rol = Number(rolId);
  if (typeof nombre !== 'string' || !nombre.trim() ||
      typeof usuario !== 'string' || !usuario.trim() ||
      typeof contrasena !== 'string' || contrasena.length < 8 ||
      ![1, 2].includes(rol)) {
    throw new HttpError(400, 'Indique nombre, usuario, rol y una contraseña válida.');
  }

  const hash = await bcrypt.hash(contrasena, 10);
  const pool = await getPool();
  const transaccion = new sql.Transaction(pool);
  await transaccion.begin();
  let idUsuario;
  try {
    const resEmp = await new sql.Request(transaccion)
      .input('nombre', sql.VarChar(100), nombre.trim())
      .input('rol', sql.Int, rol)
      .query(`
        DECLARE @empleadosInsertados TABLE (id_empleado INT);

        INSERT INTO dbo.empleados (nombre, id_rol)
        OUTPUT INSERTED.id_empleado INTO @empleadosInsertados
        VALUES (@nombre, @rol);

        SELECT id_empleado FROM @empleadosInsertados;
      `);

    const idEmpleado = resEmp.recordset[0].id_empleado;
    const resUser = await new sql.Request(transaccion)
      .input('usuario', sql.VarChar(50), usuario.trim())
      .input('hash', sql.VarChar(255), hash)
      .input('correo', sql.VarChar(100), `${usuario.trim()}@restaurante.com`)
      .input('id_empleado', sql.Int, idEmpleado)
      .input('rol', sql.Int, rol)
      .query(`
        DECLARE @usuariosInsertados TABLE (id_usuario INT);

        INSERT INTO dbo.usuarios (usuario, contrasena, correo, id_empleado, rol_id, activo)
        OUTPUT INSERTED.id_usuario INTO @usuariosInsertados
        VALUES (@usuario, @hash, @correo, @id_empleado, @rol, 1);

        SELECT id_usuario FROM @usuariosInsertados;
      `);

    idUsuario = resUser.recordset[0].id_usuario;
    await transaccion.commit();
  } catch (error) {
    await transaccion.rollback();
    throw error;
  }

  await registrarAuditoria(solicitud.usuario.id_empleado, `Alta de personal: ${usuario.trim()}`);
  return respuesta.status(201).json({ mensaje: 'Empleado registrado correctamente.', id_empleado: idUsuario });
}

async function updateStaff(solicitud, respuesta) {
  const id = Number(solicitud.params.id);
  const { nombre, usuario, contrasena, rol_id: rolId, estado } = solicitud.body || {};
  const rol = Number(rolId);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, 'Revise el identificador del usuario.');
  }

  const pool = await getPool();
  const hash = typeof contrasena === 'string' && contrasena.length >= 8
    ? await bcrypt.hash(contrasena, 10)
    : null;

  await pool.request()
    .input('id', sql.Int, id)
    .input('usuario', sql.VarChar(50), usuario.trim())
    .input('rol', sql.Int, rol)
    .input('estado', sql.Bit, Boolean(estado))
    .input('hash', sql.VarChar(255), hash)
    .query(`
      UPDATE dbo.usuarios
      SET usuario = @usuario,
          rol_id = @rol,
          activo = @estado,
          contrasena = COALESCE(@hash, contrasena)
      WHERE id_usuario = @id;
    `);

  await registrarAuditoria(solicitud.usuario.id_empleado, `Edición de personal: ${usuario.trim()}`);
  return respuesta.json({ mensaje: 'Empleado actualizado correctamente.' });
}

module.exports = { listStaff, createStaff, updateStaff };