// ==================== CONTROLADOR: AUTENTICACIÓN ====================
// Valida credenciales con bcrypt y emite JWT con identidad y rol del empleado.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
const HttpError = require('../utils/httpError');
const { registrarAuditoria } = require('../utils/audit');

async function login(solicitud, respuesta) {
  const { usuario, contrasena } = solicitud.body || {};
  if (typeof usuario !== 'string' || typeof contrasena !== 'string' || !usuario.trim() || !contrasena) {
    throw new HttpError(400, 'Escriba su usuario y contraseña.');
  }

  const pool = await getPool();
  const resultado = await pool.request()
    .input('usuario', sql.NVarChar(60), usuario.trim())
    .query(`
      SELECT 
        id_usuario,
        usuario,
        contrasena AS contrasena_hash,
        id_empleado,
        rol_id,
        activo AS estado
      FROM dbo.usuarios
      WHERE usuario = @usuario;
    `);
  const empleado = resultado.recordset[0];

  if (!empleado || !empleado.estado || !(await bcrypt.compare(contrasena, empleado.contrasena_hash))) {
    throw new HttpError(401, 'El usuario o la contraseña no son correctos.');
  }

  const identidad = {
    id_empleado: empleado.id_empleado || empleado.id_usuario,
    nombre: empleado.usuario,
    usuario: empleado.usuario,
    rol_id: empleado.rol_id || 1
  };

  const token = jwt.sign(identidad, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

  await registrarAuditoria(identidad.id_empleado, 'Inicio de sesión');
  return respuesta.json({ mensaje: 'Sesión iniciada correctamente.', token, usuario: identidad });
}

function currentUser(solicitud, respuesta) {
  return respuesta.json({ usuario: solicitud.usuario });
}

module.exports = { login, currentUser };