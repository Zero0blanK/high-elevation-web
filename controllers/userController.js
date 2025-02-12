// controllers/userController.js
const db = require('../config/db');

class UserController {

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
      req.session.userId = user[0].id;
      req.session.username = user[0].username;
      req.session.role = user[0].role;

      // Check the role and redirect accordingly
      if (user[0].role === 'admin') {
        return res.redirect('/dashboard');
      } else {
        return res.redirect('/');
      }

    } catch (err) {
      console.error('Error logging in:', err);
      return res.status(500).send('Error logging in');
    }
  }

  static async register(req, res) {
    const { first_name, last_name, email, password } = req.body;

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

  static logout(req, res) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Error logging out');
      }
      res.redirect('/');
    });
  }

  static async getUserDataById(req, res, next) {
    if (req.session.userId) {
      try {
        const query = 'SELECT CONCAT(first_name, " ", last_name) AS full_name, email, first_name, last_name, password, contact_number, profile_pic_url FROM user WHERE id = ?';
        const [user] = await db.query(query, [req.session.userId]);

        if (user.length > 0) {
          res.locals.user = {
            full_name: user[0].full_name,
            first_name: user[0].first_name,
            last_name: user[0].last_name,
            password: user[0].password,
            contact_number: user[0].contact_number,
            email: user[0].email,
            profile_pic_url: user[0].profile_pic_url
          };
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    }
    next();
  }

}

module.exports = UserController;
