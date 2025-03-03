// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const profileUpload = require('../middleware/profile-upload');

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

router.get('/profile', (req, res) => {
  res.render('profile', { title: 'Profile' });
});

router.get('/profile/address', (req, res) => {
  res.render('profileAddress', { title: 'Addresses' });
});

router.get('/profile/orders', (req, res) => {
  res.render('profileOrder', { title: 'Orders' });
});

router.get('/profile/address/edit', (req, res) => {
  res.render('profileEditAddress', { title: 'Profile Edit Address' });
});

router.post('/profile/address/add', async (req, res) => {
  try {
    const addressData = {
      street_address: req.body.street_address,
      apartment: req.body.apartment,
      city: req.body.city,
      zip_code: req.body.zip_code,
      is_default: req.body.is_default === 'on'
    }; 

    await UserController.addAddress(addressData, req.session.userId);
    res.redirect('/profile/address');
  } catch (error) {
      console.error('Error adding address:', error);
      res.status(500).send('Error adding address');
  }
});

router.get('/profile/address/edit/:id', async (req, res) => {
  try {
    const addressData = {
      street_address: req.body.street_address,
      apartment: req.body.apartment,
      city: req.body.city,
      zipcode: req.body.zip_code,
      is_default: req.body.is_default === 'on'
    }; 
      await UserController.updateAddress(req.params.id, addressData, req.session.userId);
      res.redirect('/profile/address');
  } catch (error) {
      res.status(500).send('Error loading address');
  }
});

router.post('/profile/address/edit/:id', async (req, res) => {
  try {
      await UserController.updateAddress(req.params.id, req.body, req.session.userId);
      res.redirect('/profile/address');
  } catch (error) {
      res.status(500).send('Error updating address');
  }
});

router.post('/profile/address/delete/:id', async (req, res) => {
  try {
      await UserController.deleteAddress(req.params.id, req.session.userId);
      res.redirect('/profile/address');
  } catch (error) {
      res.status(500).send('Error deleting address');
  }
});


router.post('/profile/update', 
  profileUpload.single('profile_pic'), 
  UserController.updateProfile
);

// Login route
router.post('/login', UserController.login);

// Register route
router.post('/register', UserController.register);

// Logout route
router.post('/logout', UserController.logout);

module.exports = router;
