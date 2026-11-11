// ==================== CONFIGURACIÓN: CONEXIÓN A SQL SERVER ====================
// Administra un único pool de conexiones y expone la API del controlador mssql.
const sql = require('mssql');

const configuracion = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || 'DBRestaurante',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  },
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
      throw error;
    });
  }
  return poolPrometido;
}

module.exports = { getPool, sql };
