// ==================== HELPER: AUDITORÍA DEL SISTEMA ====================
const { getPool, sql } = require('../config/db');

async function registrarAuditoria(usuarioSql, accion, tablaAfectada = 'SISTEMA') {
  try {
    const pool = await getPool();
    await pool.request()
      .input('usuario_sql', sql.VarChar(100), String(usuarioSql))
      .input('accion', sql.VarChar(100), accion)
      .input('tabla_afectada', sql.VarChar(50), tablaAfectada)
      .query(`
        INSERT INTO dbo.auditoria_sistema (usuario_sql, accion, tabla_afectada)
        VALUES (@usuario_sql, @accion, @tabla_afectada);
      `);
  } catch (error) {
    console.error('Error al registrar auditoría:', error.message);
  }
}

module.exports = { registrarAuditoria };