// ==================== RUTAS: ÓRDENES ====================
// Permite al personal consultar, crear, avanzar y cobrar comandas.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/orderController');

const router = express.Router();
router.use(authenticateToken, checkRole(1, 2));
router.get('/', asyncHandler(controlador.listOrders));
router.post('/', asyncHandler(controlador.createOrder));
router.patch('/:id/status', asyncHandler(controlador.updateOrderState));
router.post('/:id/payment', asyncHandler(controlador.payOrder));

module.exports = router;
