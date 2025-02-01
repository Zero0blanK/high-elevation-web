const express = require('express');
const db = require('../config/db')
const router = express.Router();

// Import controller
const productController = require('../controllers/productController');

// Routes
router.get('/product', async (req, res) => {
    try {
        const product = await productController.getAllProducts();
        console.log(product);
        res.render('product', { product });
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
});

// Route to handle individual product pages
router.get('/product/overview/:product_name', async (req, res) => {
    const productName = req.params.product_name;
    try {
        const query = 'SELECT * FROM product WHERE name = ?';
        const [rows] = await db.query(query, [productName]);

        if (rows.length > 0) {
            res.render('overview', { product: rows[0] });
        } else {
            res.send('Product not found');
        }
    } catch (err) {
        console.error('Error fetching product:', err.message);
        res.status(500).send('Error fetching product');
    }
});

module.exports = router;
