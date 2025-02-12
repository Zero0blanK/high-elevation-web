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
        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.image_url, 
                p.description, 
                pc.name AS category_name, 
                p.stock,
                (SELECT pw.price 
                 FROM product_weight pw 
                 JOIN weight w ON pw.weight_id = w.id 
                 WHERE pw.product_id = p.id 
                 ORDER BY w.value ASC 
                 LIMIT 1) AS lowest_price,
                GROUP_CONCAT(JSON_OBJECT(
                    'weight', w.value, 
                    'unit', w.unit, 
                    'price', pw.price, 
                    'stock', pw.stock,
                    'weight_id', pw.weight_id
                )) AS weight_variants
            FROM product p
            JOIN product_category pc ON p.category_id = pc.id
            LEFT JOIN product_weight pw ON p.id = pw.product_id
            LEFT JOIN weight w ON pw.weight_id = w.id
            WHERE p.name = ?
            GROUP BY p.id
        `;
        const [rows] = await db.query(query, [productName]);

        const productDetails = await productController.getProductDetails(rows[0].id);

        const averageRating = await productController.calculateAverageRating(productDetails);
        const distribution = await productController.getRatingDistribution(productDetails);

        if (rows.length > 0) {
            const product = rows[0];

            // Convert JSON string to array for rendering
            product.weight_variants = product.weight_variants ? JSON.parse(`[${product.weight_variants}]`) : [];
            console.log(productDetails);
            res.render('overview', {
                product,
                distribution,
                userId: req.session.userId,
                average: averageRating,
                reviews: productDetails,
                totalReviews: productDetails.length
            });
        } else {
            res.status(404).send('Product not found');
        }
    } catch (err) {
        console.error('Error fetching product:', err.message);
        res.status(500).send('Error fetching product');
    }
    
});


module.exports = router;
