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

router.get('/dashboard/customers', (req, res) => {
    res.render('dashboard-customers', { title: 'Dashboard' });
});

router.get('/dashboard/analytics', (req, res) => {
    res.render('dashboard-analytics', { title: 'Dashboard' });
});

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

router.post('/dashboard/products', upload.single("image"), dashboardController.addProduct);

router.post('/dashboard/edit-product', upload.single('image'), deleteImg, async (req, res) => {
    const { id, name, description, category } = req.body;
    const weights = req.body.weights || [];

    const productData = {
        id,
        name,
        description,
        category,
        weights,
        image: req.file ?  `/assets/product-image/${req.file.filename}` : (req.newImage || req.body.image || null),
        ...req.body // Include price and stock for each weight
    };

    console.log("Final productData:", productData);

    try {
        await dashboardController.updateProduct(productData);
        res.redirect('/dashboard/products');
    } catch (error) {
        console.error('Error updating product:', error);
    }
});

router.delete('/dashboard/products/:productId', dashboardController.deleteProductById);


module.exports = router;
