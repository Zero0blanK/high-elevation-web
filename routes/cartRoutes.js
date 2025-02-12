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

router.get('/checkout', (req, res) => {
    // Sample addresses data - replace with your database query
    const addresses = [
        {
            id: 1,
            full_address: 'Seda Hotel, 3rd floor 301B Davao City',
            default: true
        },
        // Add more addresses as needed
    ];

    // States data
    const states = [
        { code: 'AL', name: 'Alabama' },
        { code: 'AK', name: 'Alaska' },
        // ... other states
    ];
    // Sample data - replace with your actual data source
    const cartItems = [
        {
            name: "PREMIUM FILTER COFFEE BEAN",
            description: "1 kg / Arabica / Low",
            price: 24.00,
            quantity: 2,
            image: "/path/to/coffee-image-1.jpg"
        },
        {
            name: "DARK ROASTED COFFEE BEAN",
            description: "1 kg / Rich Aroma / High",
            price: 26.00,
            quantity: 2,
            image: "/path/to/coffee-image-2.jpg"
        }
    ];

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal; // Add shipping cost calculation if needed

    res.render('checkout', {
        addresses, 
        states,
        cartItems, 
        totalItems, 
        subtotal, 
        total
    });
});

// Remove item from cart
router.post('/cart/remove', cartController.removeFromCart);

// Update cart quantity
router.post('/cart/update', cartController.updateQuantity);


module.exports = router;
