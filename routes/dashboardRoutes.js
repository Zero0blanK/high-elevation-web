const express = require('express');
const db = require('../config/db')
const router = express.Router();
const upload = require("../middleware/upload");
const deleteImg = require("../middleware/delete");

// Import controller
const userController = require('../controllers/userController')
const dashboardController = require('../controllers/dashboardController')
const productController = require('../controllers/productController')

router.use(userController.getUserDataById);


router.get('/dashboard/products', async (req, res) => {
    try {
        const product = await dashboardController.getAllProducts();
        res.render('dashboard-products', { product });
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
});

router.get('/dashboard/products/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const product = await dashboardController.getProductById(productId);
        res.json(product);
    } catch (error) {
        console.error("Error fetching product details:", error);
    }
});

router.get('/dashboard', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    try {
        const topProducts = await productController.getTopProducts();
        const dashboardData = await dashboardController.getDashboardData();
        const ordersData = await dashboardController.getOrders(req);
        const {salesOverview, categorySales} = await dashboardController.getSalesData(req);

        // Provide default values if dashboardData is undefined
        const safeData = {
            totalSales: dashboardData?.totalSales || 0,
            totalOrders: dashboardData?.totalOrders || 0,
            newCustomers: dashboardData?.newCustomers || 0,
            stockLevel: dashboardData?.stockLevel || 0
        };

        const [user] = await db.query('SELECT * FROM user WHERE id = ?', [req.session.userId]);
        res.render('dashboard', { 
            username: user[0].username, 
            email: user[0].email, 
            topProducts, 
            dashboardData: safeData,
            orders: ordersData.orders,
            salesOverview,
            categorySales,
        });

    } catch (error) {
        res.status(500).send('Error fetching dashboard data: ' + error);
    }

});

router.get('/dashboard/inventory-logs', dashboardController.getInventoryData)

router.get('/dashboard/stocks', async (req, res) => {
    res.render('dashboard-stock', { title: 'Dashboard' });
});

// Add these new routes
router.get('/dashboard/stock/products', async (req, res) => {
    try {
        const products = await dashboardController.getProductInventory();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

router.post('/dashboard/stock/operation', async (req, res) => {
    try {
        const { items, operation } = req.body;
        const userId = req.session.userId; // Get logged in user ID
        
        const result = await dashboardController.processStockOperation(items, operation, userId);
        res.json(result);
    } catch (error) {
        console.error('Stock operation error:', error);
        res.status(500).json({ error: 'Failed to process stock operation' });
    }
});

router.get('/dashboard/orders', async (req, res) => {
    try {
        const { orders, shippingRate, total, totalPages, page, limit, searchQuery, statusFilter, sortFilter } = await dashboardController.getOrders(req);

        res.render('dashboard-orders', {
            title: 'Dashboard',
            orders,
            shippingRate,
            totalOrders: total,
            totalPages,
            currentPage: page,
            limit,
            searchQuery,
            statusFilter,
            sortOption: sortFilter
        });
    } catch (error) {
        console.error("Error rendering orders:", error);
    }
});

router.get('/dashboard/orders/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await dashboardController.getOrderById(orderId);
        res.json(order);
    } catch (error) {
        console.error("Error fetching order details:", error);
    }
});

router.get('/dashboard/customers', dashboardController.getCustomersData);

router.get('/dashboard/analytics', dashboardController.getAnalyticsData);

router.get('/dashboard/settings', (req, res) => {
    res.render('dashboard-settings', { title: 'Dashboard' });
});

router.post('/logout',)

router.post('/dashboard/orders/update-status', async (req, res) => {
    try {
        await dashboardController.updateUserOrderStatus(req, res);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

router.post('/dashboard/products/add', upload.single("image"), async (req, res) => {
    const { name, description, category } = req.body;
    const user_id = req.session.userId;
    const weights = req.body.weights || [];

    
    const productData = {
        user_id,
        name,
        description,
        category,
        weights,
        image: req.file ? `/assets/product-image/${req.file.filename}` : (req.body.image || null),
        ...req.body // Include price and stock for each weight
    };

    try {
        await dashboardController.addProduct(productData);
        res.json({ success: true, message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
            // Send JSON error response
        res.status(500).json({ success: false, message: 'Error adding product', error: error.message });
    }
});
router.post('/dashboard/edit-product', upload.single('image'), deleteImg, async (req, res) => {
    const { id, name, description, category } = req.body;
    const weights = req.body.weights || [];
    const user_id = req.session.userId;
    const productData = {
        user_id,
        id,
        name,
        description,
        category,
        weights,
        image: req.file ?  `/assets/product-image/${req.file.filename}` : (req.newImage || req.body.image || null),
        ...req.body // Include price and stock for each weight
    };
    try {
        await dashboardController.updateProduct(productData);
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
    }
});

router.post('/dashboard/profile/update', dashboardController.updateProfile);

router.delete('/dashboard/products/:productId', dashboardController.deleteProductById);
router.post('/dashboard/products/:productId/return', dashboardController.returnProductById);


module.exports = router;
