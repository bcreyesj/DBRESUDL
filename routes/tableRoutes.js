// ==================== RUTAS: MESAS ====================
// Expone el plano de mesas y el cambio de estado para los roles operativos.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/tableController');

const router = express.Router();
router.use(authenticateToken, checkRole(1, 2));
router.get('/', asyncHandler(controlador.listTables));
router.patch('/:id/status', asyncHandler(controlador.updateTableState));

module.exports = router;
