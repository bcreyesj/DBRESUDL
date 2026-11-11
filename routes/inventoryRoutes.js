// ==================== RUTAS: INVENTARIO Y RECETAS ====================
// Protege cambios de existencias y recetas con autorización de administrador.
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');
const controlador = require('../controllers/inventoryController');

const router = express.Router();
router.use(authenticateToken, checkRole(1));
router.get('/ingredients', asyncHandler(controlador.listIngredients));
router.patch('/ingredients/:id', asyncHandler(controlador.updateIngredient));
router.get('/recipes/:dishId', asyncHandler(controlador.getRecipe));
router.put('/recipes/:dishId', asyncHandler(controlador.saveRecipe));

module.exports = router;
