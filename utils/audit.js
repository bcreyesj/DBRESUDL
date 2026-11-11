// ==================== UTILIDAD: REGISTRO DE AUDITORÍA ====================
// Registra en SQL Server la acción realizada por una persona autenticada.
const { getPool, sql } = require('../config/db');

async function registrarAuditoria(usuarioId, accion) {
  const pool = await getPool();
  await pool.request()
    .input('usuarioId', sql.Int, usuarioId || null)
    .input('accion', sql.NVarChar(500), accion)
    .query(`
      INSERT INTO dbo.auditoria_sistema (usuario_id, accion)
      VALUES (@usuarioId, @accion);
    `);
}

module.exports = { registrarAuditoria };
