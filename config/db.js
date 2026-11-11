// ==================== CONFIGURACIÓN: CONEXIÓN A SQL SERVER (WINDOWS AUTH) ====================
require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

// Cadena de conexión nativa de Windows
const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_NAME || 'restaurante'};Trusted_Connection=yes;`;

const configuracion = {
  connectionString: connectionString,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 15000,
  requestTimeout: 30000
};

let poolPrometido;

// ==================== CONEXIÓN: INICIALIZACIÓN DEL POOL ====================
async function getPool() {
  if (!poolPrometido) {
    poolPrometido = sql.connect(configuracion).catch((error) => {
      poolPrometido = undefined;
      console.error('Error al conectar con SQL Server:', error);
      throw error;
    });
  }
  return poolPrometido;
}

module.exports = { getPool, sql };