const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const UserController = require('../controllers/userController');

// locals.user
router.use(UserController.getUserDataById);

// Add product to cart
router.post('/cart/add', cartController.addToCart);

// View cart
router.get('/cart', cartController.viewCart);

// Remove item from cart
router.post('/cart/remove', cartController.removeFromCart);

// Update cart quantity
router.post('/cart/update', cartController.updateQuantity);

module.exports = router;
