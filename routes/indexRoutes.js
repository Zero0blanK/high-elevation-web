const express = require('express');
const db = require('../config/db')
const router = express.Router();

// Import controller
const productController = require('../controllers/productController');

router.get('/', async (req, res) => {
    try {
        const product = await productController.getAllProducts();
        const title = 'High Elevation';
        res.render('index', { product, title });
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
})

module.exports = router;