const db = require('../config/db');

class UserMiddleware {
  // Middleware to add user data (full_name and email) to res.locals
  static async addUserToLocals(req, res, next) {
    if (req.session.userId) {
      try {
        const query = 'SELECT CONCAT(first_name, " ", last_name) AS full_name, email FROM user WHERE id = ?';
        const [user] = await db.query(query, [req.session.userId]);
        
        if (user.length > 0) {
          res.locals.user = {
            full_name: user[0].full_name,
            email: user[0].email
          };
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    }
    next();
  }
}

module.exports = UserMiddleware;
