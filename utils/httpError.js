// ==================== UTILIDAD: ERRORES HTTP CONTROLADOS ====================
// Conserva el código HTTP y el mensaje en español para respuestas coherentes.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = HttpError;
