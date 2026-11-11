// ==================== RUTAS: PANEL ADMINISTRATIVO ====================
// Entrega indicadores de operación exclusivamente a administradores.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/dashboardController');

const router = express.Router();
router.use(authenticateToken, checkRole(1));
router.get('/overview', asyncHandler(controlador.getOverview));

module.exports = router;
