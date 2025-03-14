const express = require('express');
const db = require('../config/db')
const router = express.Router();

// Import controller
const productController = require('../controllers/productController');
const dashboardController = require('../controllers/dashboardController');

// Routes
router.get('/product', async (req, res) => {
    try {
        // Get query parameters with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const search = req.query.search || '';
        const category = req.query.category ? [].concat(req.query.category) : [];
        const size = req.query.size ? [].concat(req.query.size) : [];
        const maxPrice = parseInt(req.query.maxPrice) || 2000;
        const sortBy = req.query.sortBy || 'price-low';
        
        // Build the query
        let query = `
            SELECT p.*, pc.name AS category_name, 
            MIN(pw.price) AS lowest_price,
            (SELECT price FROM product_weight WHERE product_id = p.id ORDER BY price DESC LIMIT 1) AS original_price,
            (DATEDIFF(CURDATE(), p.created_at) <= 30) AS isNew,
            GROUP_CONCAT(
                JSON_OBJECT(
                    'weight', w.value,
                    'unit', w.unit,
                    'price', pw.price,
                    'stock', pw.stock
                )
            ) AS weight_variants
            FROM product p
            LEFT JOIN product_category pc ON p.category_id = pc.id
            LEFT JOIN product_weight pw ON p.id = pw.product_id
            LEFT JOIN weight w ON pw.weight_id = w.id
            WHERE p.is_deleted = 0
        `;
        
        const queryParams = [];
        
        // Add search condition
        if (search) {
            query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        // Add category filter
        if (category && category.length > 0) {
            query += ` AND pc.name IN (?)`;
            queryParams.push(category);
        }
        
        // Group by product ID
        query += ` GROUP BY p.id`;
        
        // Add price filter to HAVING clause
        query += ` HAVING lowest_price <= ?`;
        queryParams.push(maxPrice);
        
        // Add size filter if needed
        if (size && size.length > 0) {
            // This is more complex and requires HAVING with JSON search
            // We'll do a simplified version for now
            query += ` AND EXISTS (
                SELECT 1 FROM product_weight pw2 
                JOIN weight w2 ON pw2.weight_id = w2.id 
                WHERE pw2.product_id = p.id AND CONCAT(w2.value, w2.unit) IN (?)
            )`;
            queryParams.push(size);
        }
        
        // Add sorting
        if (sortBy === 'price-low') {
            query += ` ORDER BY lowest_price ASC`;
        } else if (sortBy === 'price-high') {
            query += ` ORDER BY lowest_price DESC`;
        }
        
        // Count total results for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
        const [countResult] = await db.query(countQuery, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        
        // Add pagination
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(limit, (page - 1) * limit);
        
        // Execute final query
        const [products] = await db.query(query, queryParams);
        
        // Render the page with all necessary data
        res.render('product', {
            product: products,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: {
                search: search,
                category: category,
                size: size,
                maxPrice: maxPrice,
                sortBy: sortBy
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
});

router.post('/reviews/add', productController.addReview);

// Route to handle individual product pages
router.get('/product/overview/:product_name', async (req, res) => {
    const productName = req.params.product_name.replace(/%20/g, ' ');
    const userId = req.session.userId;

    try {
        const query = `
            SELECT 
                p.id, 
                p.name, 
                p.image_url, 
                p.description, 
                pc.name AS category_name, 
                p.total_stock,
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

        const [hasPurchased] = await db.query(`
            SELECT COUNT(*) AS count FROM user_order
            JOIN order_detail ON user_order.id = order_detail.user_order_id
            WHERE user_order.user_id = ? AND order_detail.product_id = ?`,
            [userId, rows[0].id]
        );

        const [orderDelivered] = await db.query(`
            SELECT COUNT(*) AS count FROM user_order
            JOIN order_detail ON user_order.id = order_detail.user_order_id
            WHERE user_order.user_id = ? AND order_detail.product_id = ?
            AND user_order.shipping_status = 'Delivered'`,
            [userId, rows[0].id]
        );
        
        // Check if user has already reviewed the product
        const [hasReviewed] = await db.query(`
            SELECT COUNT(*) AS count FROM review
            WHERE user_id = ? AND product_id = ?`,
            [userId, rows[0].id]
        );

        if (rows.length > 0) {
            const product = rows[0];

            // Convert JSON string to array for rendering
            product.weight_variants = product.weight_variants ? JSON.parse(`[${product.weight_variants}]`) : [];
            console.log(productDetails);
            res.render('overview', {
                product,
                distribution,
                userId,
                hasPurchased: hasPurchased[0].count > 0,
                orderDelivered: orderDelivered[0].count > 0 ? 'delivered' : 'pending',
                hasReviewed: hasReviewed[0].count > 0,
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
