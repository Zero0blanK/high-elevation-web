const express = require('express');
const db = require('../config/db')
const router = express.Router();

// Import controller
const dashboardController = require('../controllers/dashboardController')

router.get('/dashboard/products', async (req, res) => {
    try {
        const product = await dashboardController.getAllProducts();
        console.log(product);
        res.render('dashboard-products', { product });
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
});

router.get('/dashboard', (req, res) => {
    res.render('dashboard-orders', { title: 'Dashboard' });
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


module.exports = router;
