// ==================== CONTROLADOR: AUDITORÍA DEL SISTEMA ====================
// Presenta los eventos recientes junto al usuario SQL o de aplicación que los generó.
const { getPool, sql } = require('../config/db');

async function listAudit(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request()
    .input('limite', sql.Int, 100)
    .query(`
      SELECT TOP (@limite) 
        id_auditoria AS id_log, 
        accion, 
        fecha_registro AS fecha,
        COALESCE(usuario_sql, N'Sistema') AS usuario
      FROM dbo.auditoria_sistema
      ORDER BY fecha_registro DESC;
    `);
  return respuesta.json({ eventos: resultado.recordset });
}

module.exports = { listAudit };