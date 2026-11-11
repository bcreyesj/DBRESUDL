// ==================== CONTROLADOR: AUDITORÍA DEL SISTEMA ====================
// Presenta los eventos recientes junto al nombre de la persona que los generó.
const { getPool, sql } = require('../config/db');

async function listAudit(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request()
    .input('limite', sql.Int, 100)
    .query(`
      SELECT TOP (@limite) a.id_log, a.accion, a.fecha,
             COALESCE(e.nombre, N'Sistema') AS usuario
      FROM dbo.auditoria_sistema AS a
      LEFT JOIN dbo.empleados AS e ON e.id_empleado = a.usuario_id
      ORDER BY a.fecha DESC;
    `);
  return respuesta.json({ eventos: resultado.recordset });
}

module.exports = { listAudit };
