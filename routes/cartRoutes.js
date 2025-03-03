const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const UserController = require('../controllers/userController');
const db = require('../config/db');

// locals.user
router.use(UserController.getUserDataById);

// Add product to cart
router.post('/cart/add', CartController.addToCart);

// View cart
router.get('/cart', CartController.viewCart);

router.get('/cart/checkout', async (req, res) => {

  try {
    const user_id = req.session.userId;

    if (!user_id) {
        return res.redirect('/login');
    }
    let cartItems, totalItems, subtotal;

    // Check if this is a buy now request
    if (req.query.buyNow) {
      console.log('Buy Now parameters:', req.query); // Log the parameters
        // Get product details for buy now
        const [rows] = await db.query(`
            SELECT 
                p.id as product_id,
                p.name, 
                p.image_url, 
                pw.price, 
                pw.weight_id,
                w.value AS weight, 
                w.unit, 
                pc.name AS category_name
            FROM product p
            JOIN product_weight pw ON p.id = pw.product_id
            JOIN weight w ON pw.weight_id = w.id
            JOIN product_category pc ON p.category_id = pc.id
            WHERE p.id = ? AND pw.weight_id = ?
        `, [req.query.product_id, req.query.weight_id]);
        
        const product = rows[0];

        const quantity = parseInt(req.query.quantity);
        if (quantity > product.stock) {
            return res.status(400).render('error', {
                error: 'Not enough stock available',
                title: 'Error'
            });
        }

        cartItems = [{
            product,
            quantity
        }];
        totalItems = quantity;
        subtotal = product.price * quantity;
    } else {
        // Regular cart checkout
        cartItems = await CartController.viewCart(req, res);
        totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }

    const shippingRates = 5 / 100;
    const shipping = subtotal * shippingRates;
    const total = subtotal + shipping;

    res.render('checkout', {
        addresses: res.locals.addresses,
        cartItems,
        totalItems,
        subtotal,
        shipping,
        total,
        isBuyNow: !!req.query.buyNow
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
