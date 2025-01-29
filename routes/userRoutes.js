// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

function isAdmin(req, res, next) {
  if (req.session.role !== 'admin') {
    return res.redirect('/');
  }
  next();
}

router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

router.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

router.get('/logout', UserController.logout);

// Login route
router.post('/login', UserController.login);

// Register route
router.post('/register', UserController.register);

// Dashboard route (protected page)
router.get('/dashboard', isAdmin, UserController.dashboard);

// Logout route
router.post('/logout', UserController.logout);

module.exports = router;
