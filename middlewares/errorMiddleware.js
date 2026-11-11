// ==================== MIDDLEWARE: ERRORES Y RUTAS NO ENCONTRADAS ====================
// Traduce errores de aplicación a respuestas JSON sin filtrar detalles internos.
function notFound(solicitud, respuesta, siguiente) {
  const error = new Error('No se encontró el recurso solicitado.');
  error.status = 404;
  siguiente(error);
}

function errorHandler(error, solicitud, respuesta, siguiente) {
  if (respuesta.headersSent) return siguiente(error);

  const status = Number(error.status) || 500;
  if (status >= 500) console.error('Error interno de la aplicación:', error);

  return respuesta.status(status).json({
    mensaje: status >= 500 ? 'Ocurrió un error interno. Intente nuevamente.' : error.message,
    ...(process.env.NODE_ENV === 'development' && status >= 500 ? { detalle: error.message } : {})
  });
}

module.exports = { notFound, errorHandler };
