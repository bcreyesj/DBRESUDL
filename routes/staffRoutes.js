// ==================== RUTAS: PERSONAL ====================
// Restringe toda consulta y edición de empleados al rol administrador.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/staffController');

const router = express.Router();
router.use(authenticateToken, checkRole(1));
router.get('/', asyncHandler(controlador.listStaff));
router.post('/', asyncHandler(controlador.createStaff));
router.put('/:id', asyncHandler(controlador.updateStaff));

module.exports = router;
