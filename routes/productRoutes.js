const express = require('express');
const router = express.Router();

// Import controller
const productController = require('../controllers/productController');

// Routes
router.get('/', (req, res) => {
    res.render('product', { title: 'Product' });
});

module.exports = router;
