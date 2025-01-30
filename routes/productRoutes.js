const express = require('express');
const router = express.Router();

// Import controller
const productController = require('../controllers/productController');

// Routes
router.get('/', (req, res) => {
    res.render('product', { title: 'Product' });
});

router.get('/overview', (req, res) => {
    res.render('overview', { title: 'Overview' });
});

module.exports = router;
