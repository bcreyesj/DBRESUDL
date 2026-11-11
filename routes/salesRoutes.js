// ==================== RUTAS: VENTAS Y PAGOS ====================
// Restringe reportes y métodos de pago al panel administrativo.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/salesController');

const router = express.Router();
router.use(authenticateToken);
router.get('/', checkRole(1), asyncHandler(controlador.getSales));
router.get('/methods', checkRole(1, 2), asyncHandler(controlador.listPaymentMethods));

module.exports = router;
