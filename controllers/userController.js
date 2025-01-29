// controllers/userController.js
const db = require('../config/db');

class UserController {
  // Login logic with role check
  static async login(req, res) {
    const { email, password } = req.body;

    try {
      // Query the database to find the user
      const [user] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);
      
      // Check if user exists and password is correct
      if (user.length === 0 || user[0].password !== password) {
        return res.status(400).send('Invalid email or password');
      }
      
      // Set session variables for the logged-in user
      req.session.userId = user[0].id; // Set userId
      req.session.username = user[0].username;
      req.session.role = user[0].role;

      // Check the role and redirect accordingly
      if (user[0].role === 'admin') {
        // Redirect to the dashboard for admin users
        return res.redirect('/dashboard');
      } else {
        // Redirect to the home page for non-admin users
        return res.redirect('/');
      }

    } catch (err) {
      console.error('Error logging in:', err);
      return res.status(500).send('Error logging in');
    }
  }

  // Register logic
  static async register(req, res) {
    const { first_name, last_name, email, password } = req.body;
    console.log(req.body);  // Log the form data

    try {
      const [existingUser] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
      if (existingUser.length > 0) {
        return res.status(400).send('Username already taken');
      }

      await db.query('INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)', [first_name, last_name, email, password]);
      res.redirect('/');
    } catch (err) {
      console.log('Error registering user:', err);
      res.status(500).send('Error registering user');
    }
  }

  // Dashboard (protected page)
  static async dashboard(req, res) {
    if (!req.session.userId) {
      return res.redirect('/');
    }

    try {
      const [user] = await db.query('SELECT * FROM user WHERE id = ?', [req.session.userId]);
      res.render('dashboard', { username: user[0].username, email: user[0].email });
    } catch (err) {
      res.status(500).send('Error fetching user data');
    }
  }

  // Logout logic
  static logout(req, res) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Error logging out');
      }
      res.redirect('/');
    });
  }
}

module.exports = UserController;
