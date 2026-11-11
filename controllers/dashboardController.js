// ==================== CONTROLADOR: INDICADORES DEL PANEL ====================
// Recupera ventas, órdenes activas, alertas de inventario y actividad reciente.
const { getPool } = require('../config/db');

async function getOverview(solicitud, respuesta) {
  const pool = await getPool();
  const [indicadores, alertas, actividad] = await Promise.all([
    pool.request().query(`
      SELECT
        CAST(COALESCE((SELECT SUM(p.monto_total) FROM dbo.pagos AS p
          WHERE CONVERT(date, p.fecha_hora) = CONVERT(date, GETDATE())), 0) AS DECIMAL(12,2)) AS ventas_hoy,
        (SELECT COUNT(*) FROM dbo.ordenes AS o
          WHERE o.estado NOT IN (N'Pagado', N'Cancelado', N'Pagada', N'Cancelada')) AS ordenes_activas,
        (SELECT COUNT(*) FROM dbo.ingredientes AS i
          WHERE i.stock_actual <= i.stock_minimo) AS alertas_stock;
    `),
    pool.request().query(`
      SELECT TOP (6) id_ingrediente, nombre, stock_actual, stock_minimo, unidad_medida
      FROM dbo.ingredientes
      WHERE stock_actual <= stock_minimo
      ORDER BY (stock_minimo - stock_actual) DESC, nombre;
    `),
    pool.request().query(`
      SELECT TOP (5) o.id_orden, o.estado, COALESCE(detalle.total, 0) AS total, o.fecha_hora, m.numero_mesa
      FROM dbo.ordenes AS o
      INNER JOIN dbo.mesas AS m ON m.id_mesa = o.id_mesa
      OUTER APPLY (
        SELECT SUM(d.subtotal) AS total
        FROM dbo.detalle_ordenes AS d
        WHERE d.id_orden = o.id_orden
      ) AS detalle
      WHERE o.estado NOT IN (N'Pagado', N'Cancelado', N'Pagada', N'Cancelada')
      ORDER BY o.fecha_hora DESC;
    `)
  ]);

  return respuesta.json({
    indicadores: indicadores.recordset[0],
    alertas: alertas.recordset,
    actividad: actividad.recordset
  });
}

module.exports = { getOverview };