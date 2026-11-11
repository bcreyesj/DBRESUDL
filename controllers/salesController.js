// ==================== CONTROLADOR: VENTAS Y PAGOS ====================
// Agrupa ingresos y métodos de pago para el periodo solicitado.
const { getPool, sql } = require('../config/db');

async function getSales(solicitud, respuesta) {
  const diasSolicitados = Number(solicitud.query.dias || 7);
  const dias = Number.isInteger(diasSolicitados) ? Math.min(Math.max(diasSolicitados, 1), 90) : 7;
  const pool = await getPool();
  const [totales, metodos, diario] = await Promise.all([
    pool.request()
      .input('dias', sql.Int, dias)
      .query(`
        SELECT CAST(COALESCE(SUM(monto_total), 0) AS DECIMAL(12,2)) AS ingresos,
               COUNT(*) AS cantidad_pagos
        FROM dbo.pagos
        WHERE fecha_hora >= DATEADD(day, -@dias + 1, CONVERT(date, GETDATE()));
      `),
    pool.request()
      .input('dias', sql.Int, dias)
      .query(`
        SELECT mp.nombre AS metodo, CAST(SUM(p.monto_total) AS DECIMAL(12,2)) AS monto,
               COUNT(*) AS cantidad
        FROM dbo.pagos AS p
        INNER JOIN dbo.metodos_pago AS mp ON mp.id_metodo = p.id_metodo
        WHERE p.fecha_hora >= DATEADD(day, -@dias + 1, CONVERT(date, GETDATE()))
        GROUP BY mp.nombre
        ORDER BY monto DESC;
      `),
    pool.request()
      .input('dias', sql.Int, dias)
      .query(`
        SELECT CONVERT(date, fecha_hora) AS fecha,
               CAST(SUM(monto_total) AS DECIMAL(12,2)) AS ingresos
        FROM dbo.pagos
        WHERE fecha_hora >= DATEADD(day, -@dias + 1, CONVERT(date, GETDATE()))
        GROUP BY CONVERT(date, fecha_hora)
        ORDER BY fecha;
      `)
  ]);
  return respuesta.json({
    periodo_dias: dias,
    resumen: totales.recordset[0],
    metodos: metodos.recordset,
    diario: diario.recordset
  });
}

async function listPaymentMethods(solicitud, respuesta) {
  const pool = await getPool();
  const resultado = await pool.request().query(`
    SELECT id_metodo AS id_metodo_pago, nombre
    FROM dbo.metodos_pago
    ORDER BY nombre;
  `);
  return respuesta.json({ metodos: resultado.recordset });
}

module.exports = { getSales, listPaymentMethods };