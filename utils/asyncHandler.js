// ==================== UTILIDAD: CONTROLADORES ASÍNCRONOS ====================
// Envía los errores de promesas rechazadas al middleware central de Express.
module.exports = (controlador) => (solicitud, respuesta, siguiente) => {
  Promise.resolve(controlador(solicitud, respuesta, siguiente)).catch(siguiente);
};
