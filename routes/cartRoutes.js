const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const UserController = require('../controllers/userController');
const db = require('../config/db');

// locals.user
router.use(UserController.getUserDataById);

// Add product to cart
router.post('/cart/add', CartController.addToCart);

router.post("/add-address", async (req, res) => {
    try {
      // Get data from the form
      const { street_address, apartment, city, zip_code } = req.body;
      
      // Check if is_default was checked
      const is_default = req.body.is_default ? true : false;
      
      // Get the user ID from the session
      const userId = req.session.userId;
      
      // Prepare the address data
      const addressData = {
        street_address,
        apartment,
        city,
        zip_code,
        is_default
      };
      
      // Call the database function
      await UserController.addAddress(addressData, userId);
      
      // Redirect back to checkout page with success message
      res.json({ success: true, message: 'Address added successfully' });
    } catch (error) {
      console.error('Error adding address:', error);
      res.json({ success: false, message: 'Error adding address', error: error.message });
    }
  });

// View cart
router.get('/cart', CartController.viewCart);

router.get('/cart/checkout', async (req, res) => {
    try {
        const user_id = req.session.userId;
        if (!user_id) {
            return res.redirect('/login');
        }

        let cartItems, totalItems, subtotal;
        const isBuyNow = req.query.buyNow === "true"; // Explicit check

        if (isBuyNow) {
            console.log('Buy Now parameters:', req.query); // Debugging log

            // Validate query parameters
            const productId = parseInt(req.query.product_id);
            const weightId = parseInt(req.query.weight_id);
            const quantity = parseInt(req.query.quantity);

            if (isNaN(productId) || isNaN(weightId) || isNaN(quantity) || quantity <= 0) {
                return res.status(400).render('error', {
                    error: 'Invalid buy now parameters',
                    title: 'Error'
                });
            }

            // Fetch product details
            const [rows] = await db.query(`
                SELECT 
                    p.id AS product_id,
                    p.name, 
                    p.image_url, 
                    pw.price, 
                    pw.stock,  -- Ensure stock is fetched
                    pw.weight_id,
                    w.value AS weight, 
                    w.unit, 
                    pc.name AS category_name
                FROM product p
                JOIN product_weight pw ON p.id = pw.product_id
                JOIN weight w ON pw.weight_id = w.id
                JOIN product_category pc ON p.category_id = pc.id
                WHERE p.id = ? AND pw.weight_id = ?
            `, [productId, weightId]);

            const product = rows[0];

            if (!product) {
                return res.status(404).render('error', {
                    error: 'Product not found',
                    title: 'Error'
                });
            }

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
            isBuyNow
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
