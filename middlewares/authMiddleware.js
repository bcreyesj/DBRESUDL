// ==================== MIDDLEWARE: AUTENTICACIÓN Y ROLES ====================
// Verifica JWT firmados y restringe las rutas a los roles indicados.
const jwt = require('jsonwebtoken');

function authenticateToken(solicitud, respuesta, siguiente) {
  const encabezado = solicitud.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null;

  if (!token) {
    return respuesta.status(401).json({ mensaje: 'Inicie sesión para continuar.' });
  }

  try {
    solicitud.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return siguiente();
  } catch {
    return respuesta.status(401).json({ mensaje: 'La sesión venció o no es válida. Inicie sesión nuevamente.' });
  }
}

// ==================== AUTORIZACIÓN: CONTROL DE ACCESO POR ROL ====================
function checkRole(...rolesPermitidos) {
  return (solicitud, respuesta, siguiente) => {
    if (!solicitud.usuario || !rolesPermitidos.includes(Number(solicitud.usuario.rol_id))) {
      return respuesta.status(403).json({ mensaje: 'No tiene permisos para realizar esta acción.' });
    }
    return siguiente();
  };
}

module.exports = { authenticateToken, checkRole };
