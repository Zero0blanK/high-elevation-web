// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// locals.user
router.use(UserController.getUserDataById);

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

// Logout route
router.post('/logout', UserController.logout);

module.exports = router;
