const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const UserController = require('../controllers/userController');

// locals.user
router.use(UserController.getUserDataById);

// Add product to cart
router.post('/cart/add', CartController.addToCart);

// View cart
router.get('/cart', CartController.viewCart);

router.get('/cart/checkout', async (req, res) => {

    try {
        const cartItems = await CartController.viewCart(req, res);

        let totalItems = 0;
        cartItems.forEach(item => {
          totalItems += item.quantity;
        });

        let subtotal = 0;
        cartItems.forEach(item => {
          subtotal += item.quantity * item.price;
        });
        const shippingRates = 5 / 100;
        const shipping = subtotal * shippingRates;

        const total = subtotal + shipping; // Add shipping cost calculation if needed

        res.render('checkout', {
          addresses: res.locals.addresses,
          cartItems,
          totalItems,
          subtotal,
          shipping,
          total
        });
    } catch (err) {
        console.error('Error fetching checkout data:', err.message);
        res.status(500).json({ error: 'Error fetching checkout data' });
    }
});

// Remove item from cart
router.post('/cart/remove', CartController.removeFromCart);

// Update cart quantity
router.post('/cart/update', CartController.updateQuantity);

// Payment from cart item
router.post('/cart/paynow', CartController.cartItemPayment);

module.exports = router;
