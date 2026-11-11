// ==================== CONTROLADOR: MESAS ====================
// Consulta mesas y actualiza sus estados permitidos desde el plano de servicio.
const { getPool, sql } = require('../config/db');
const HttpError = require('../utils/httpError');
const { registrarAuditoria } = require('../utils/audit');

async function listTables(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request().query(`
    SELECT m.id_mesa, m.numero_mesa, m.capacidad, m.estado,
           o.id_orden, o.total_orden, o.inicio_orden
    FROM dbo.mesas AS m
    OUTER APPLY (
      SELECT TOP (1) orden.id_orden, ISNULL(SUM(d.subtotal), 0) AS total_orden, orden.fecha_hora AS inicio_orden
      FROM dbo.ordenes AS orden
      LEFT JOIN dbo.detalle_ordenes AS d ON orden.id_orden = d.id_orden
      WHERE orden.id_mesa = m.id_mesa
        AND orden.estado NOT IN (N'Pagada', N'Cancelada')
      GROUP BY orden.id_orden, orden.fecha_hora
      ORDER BY orden.fecha_hora DESC
    ) AS o
    ORDER BY m.numero_mesa;
  `);
  return respuesta.json({ mesas: resultado.recordset });
}

async function updateTableState(solicitud, respuesta) {
  const id = Number(solicitud.params.id);
  const estado = solicitud.body?.estado;
  const estadosValidos = ['Disponible', 'Reservada', 'Ocupada', 'Mantenimiento'];
  if (!Number.isInteger(id) || id < 1 || !estadosValidos.includes(estado)) {
    throw new HttpError(400, 'Seleccione un estado válido para la mesa.');
  }
  const pool = await getPool();
  const resultado = await pool.request()
    .input('id', sql.Int, id)
    .input('estado', sql.VarChar(20), estado)
    .query(`
      UPDATE dbo.mesas
      SET estado = @estado
      WHERE id_mesa = @id
        AND NOT EXISTS (
          SELECT 1 FROM dbo.ordenes AS o
          WHERE o.id_mesa = @id AND o.estado NOT IN (N'Pagada', N'Cancelada')
        );
    `);
  if (!resultado.rowsAffected[0]) {
    throw new HttpError(409, 'La mesa no existe o tiene una comanda activa.');
  }
  await registrarAuditoria(solicitud.usuario.id_empleado, `Mesa ${id}: estado ${estado}`);
  return respuesta.json({ mensaje: 'Estado de la mesa actualizado.' });
}

module.exports = { listTables, updateTableState };