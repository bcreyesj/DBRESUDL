// ==================== RUTAS: MENÚ ====================
// Permite consultar platillos y limitar la gestión del menú al rol administrador.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/menuController');

const router = express.Router();
router.use(authenticateToken);
router.get('/', asyncHandler(controlador.listDishes));
router.get('/categories', asyncHandler(controlador.listCategories));
router.post('/', checkRole(1), asyncHandler(controlador.createDish));
router.put('/:id', checkRole(1), asyncHandler(controlador.updateDish));
router.patch('/:id/availability', checkRole(1), asyncHandler(controlador.toggleDish));
router.post('/categories', checkRole(1), asyncHandler(controlador.createCategory));
router.put('/categories/:id', checkRole(1), asyncHandler(controlador.updateCategory));
router.patch('/categories/:id/status', checkRole(1), asyncHandler(controlador.toggleCategory));

module.exports = router;
