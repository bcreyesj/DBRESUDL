// ==================== RUTAS: AUTENTICACIÓN ====================
// Expone inicio de sesión y consulta de identidad con protección JWT.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/authController');

const router = express.Router();
router.post('/login', asyncHandler(controlador.login));
router.get('/me', authenticateToken, asyncHandler(controlador.currentUser));

module.exports = router;
