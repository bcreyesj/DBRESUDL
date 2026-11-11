// ==================== RUTAS: AUDITORÍA ====================
// Limita la consulta de actividad sensible del sistema a los administradores.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/auditController');

const router = express.Router();
router.use(authenticateToken, checkRole(1));
router.get('/', asyncHandler(controlador.listAudit));

module.exports = router;
