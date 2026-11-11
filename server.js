// ==================== SERVIDOR: APLICACIÓN DBRESTAURANTE ====================
// Configura Express, sirve las pantallas y monta las API modulares del sistema.
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configure JWT_SECRET con al menos 32 caracteres en el archivo .env.');
}

const app = express();
const origenesPermitidos = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origen) => origen.trim());

// ==================== MIDDLEWARES: CORS, JSON Y ARCHIVOS ESTÁTICOS ====================
app.use(cors({
  origin: (origen, callback) => callback(null, !origen || origenesPermitidos.includes(origen)),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ==================== RUTAS DE LA API ====================
app.get('/api/health', (solicitud, respuesta) => {
  respuesta.json({ estado: 'disponible', servicio: 'DBRestaurante' });
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// ==================== RUTAS DE LAS PANTALLAS ====================
app.get('/', (solicitud, respuesta) => respuesta.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/admin/dashboard', (solicitud, respuesta) => respuesta.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/employee/dashboard', (solicitud, respuesta) => respuesta.sendFile(path.join(__dirname, 'public', 'employee.html')));

// ==================== ERRORES Y ARRANQUE DEL SERVIDOR ====================
app.use(notFound);
app.use(errorHandler);

const puerto = Number(process.env.PORT || 3000);
app.listen(puerto, () => {
  console.log(`DBRestaurante disponible en http://localhost:${puerto}`);
});
