const express = require('express');
const db = require('../config/db')
const router = express.Router();
const upload = require("../middleware/upload");

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

router.get('/dashboard', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    try {
        const topProducts = await productController.getTopProducts();
        const dashboardData = await dashboardController.getDashboardData();

        console.log("Fetched Dashboard Data:", dashboardData);
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
            dashboardData: safeData 
        });

    } catch (error) {
        res.status(500).send('Error fetching dashboard data');
    }

});

router.get('/dashboard/orders', (req, res) => {
    res.render('dashboard-orders', { title: 'Dashboard' });
});

router.get('/dashboard/products', (req, res) => {
    res.render('dashboard-products', { title: 'Dashboard' });
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

router.post('/dashboard/products', upload.single("image"), dashboardController.addProduct);

router.delete('/dashboard/products/:productId', dashboardController.deleteProductById);


module.exports = router;
