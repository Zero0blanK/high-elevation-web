// controllers/userController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

class UserController {

  static async login(req, res) {
    const { email, password } = req.body;
    try {
      // Query the database to find the user
      const [user] = await db.execute('SELECT * FROM user WHERE email = ?', [email]);

      const isMatch = await bcrypt.compare(password, user[0].password);

      // Check if user exists and password is correct
      if (user.length === 0 || !isMatch) {
        req.flash('error', 'Invalid email and password. Please try again.');
        return res.redirect('/login');
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
        req.flash('error', 'This email is already registered.');
        return res.redirect('/register');
      }

      // Hash the password before saving it
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.query('INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)', [first_name, last_name, email, hashedPassword]);
      req.flash('success', `Welcome, ${first_name}! Your account has been created. You can now log in.`);
      res.redirect('/login');
    } catch (err) {
      console.log('Error registering user:', err);
      req.flash('error', 'An unexpected error occurred while registering. Please try again later.');
      res.status(500).redirect('/register');
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
  static async getUserOrders(userId) {
    try {
      const query = `
        SELECT 
          uo.id as order_id,
          uo.order_date,
          uo.total_amount,
          uo.order_status,
          uo.shipping_status,
          p.id as product_id,
          p.name as product_name,
          p.image_url,
          od.quantity,
          pw.price,
          w.value as weight_value,
          w.unit as weight_unit,
          pc.name as category_name
        FROM user_order uo
        JOIN order_detail od ON uo.id = od.user_order_id
        JOIN product p ON od.product_id = p.id
        JOIN product_weight pw ON od.weight_id = pw.weight_id
        JOIN weight w ON pw.weight_id = w.id
        JOIN product_category pc ON p.category_id = pc.id
        WHERE uo.user_id = ?
        ORDER BY uo.order_date DESC`;

      const [rows] = await db.query(query, [userId]);
      return this.formatOrders(rows);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  static formatOrders(rows) {
    const orders = {};
    
    rows.forEach(row => {
        const orderId = row.order_id;
        if (!orders[orderId]) {
            orders[orderId] = {
                id: orderId,
                order_date: row.order_date,
                total_amount: row.total_amount,
                order_status: row.order_status,
                shipping_status: row.shipping_status,
                items: new Map() // Use Map to ensure unique items
            };
        }
        
        const itemKey = `${row.product_id}-${row.weight_value}`;
        if (!orders[orderId].items.has(itemKey)) {
            orders[orderId].items.set(itemKey, {
                product_id: row.product_id,
                name: row.product_name,
                image_url: row.image_url,
                quantity: row.quantity,
                price: row.price,
                weight_value: row.weight_value,
                weight_unit: row.weight_unit,
                category_name: row.category_name
            });
        }
    });

    // Convert Map to Array for each order
    Object.values(orders).forEach(order => {
        order.items = Array.from(order.items.values());
    });

    return Object.values(orders);
  }
  static async getUserDataById(req, res, next) {
    if (req.session.userId) {
      try {
        const orders = await UserController.getUserOrders(req.session.userId);

        const query = `
        SELECT CONCAT(u.first_name, " ", u.last_name) AS full_name, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.password, 
        u.contact_number, 
        u.profile_pic_url
        FROM user u
        WHERE id = ?
        `;
        const [user] = await db.query(query, [req.session.userId]);

        // Fetch all addresses for the user
        const addressQuery = `
        SELECT id,
        CONCAT(street_address, ", ", city, ", ", zip_code) AS full_address,
        street_address,
        apartment,
        city,
        zip_code,
        is_default
        FROM user_address
        WHERE user_id = ?`;
        const [addresses] = await db.query(addressQuery, [req.session.userId]);

        if (user.length > 0) {
          res.locals.user = {
            full_name: user[0].full_name,
            first_name: user[0].first_name,
            last_name: user[0].last_name,
            password: user[0].password,
            contact_number: user[0].contact_number,
            email: user[0].email,
            profile_pic_url: user[0].profile_pic_url,
            orders: orders,
            addresses: addresses.length > 0 ? addresses : []
          };
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    }
    next();
  }

  static async addAddress(addressData, userId) {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        if (addressData.is_default) {
            await connection.query(
                'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                [userId]
            );
        }

        console.log('Adding address:', addressData);

        const query = `
            INSERT INTO user_address 
            (user_id, street_address, apartment, city, zip_code, is_default)
            VALUES (?, ?, ?, ?, ?, ?)`;
        
        await connection.query(query, [
            userId,
            addressData.street_address,
            addressData.apartment,
            addressData.city,
            addressData.zip_code,
            addressData.is_default ? 1 : 0
        ]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
  }

  static async updateAddress(addressId, addressData, userId) {
      const connection = await db.getConnection();
      try {
          await connection.beginTransaction();

          if (addressData.is_default) {
              await connection.query(
                  'UPDATE user_address SET is_default = 0 WHERE user_id = ?',
                  [userId]
              );
          }

          const query = `
              UPDATE user_address 
              SET street_address = ?, 
                  apartment = ?,
                  city = ?,
                  zip_code = ?,
                  is_default = ?
              WHERE id = ? AND user_id = ?`;

          await connection.query(query, [
              addressData.street_address,
              addressData.apartment || '',
              addressData.city,
              addressData.zip_code,
              addressData.is_default ? 1 : 0,
              addressId,
              userId
          ]);

          await connection.commit();
      } catch (error) {
          await connection.rollback();
          throw error;
      } finally {
          connection.release();
      }
  }

  static async deleteAddress(addressId, userId) {
      const query = `
          DELETE FROM user_address 
          WHERE id = ? AND user_id = ? AND is_default = 0`;
      await db.query(query, [addressId, userId]);
  }

  static async updateProfile(req, res) {
    const userId = req.session.userId;
    const { first_name, last_name, contact_number, password } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const updateQuery = `
            UPDATE user 
            SET first_name = ?,
                last_name = ?,
                contact_number = ?
                ${password ? ', password = ?' : ''}
            WHERE id = ?`;

        const queryParams = password ? 
            [first_name, last_name, contact_number, password, userId] :
            [first_name, last_name, contact_number, userId];

        await connection.execute(updateQuery, queryParams);

        if (req.file) {
            const imageUrl = `/assets/profile-image/${req.file.filename}`;
            await connection.execute(
                'UPDATE user SET profile_pic_url = ? WHERE id = ?',
                [imageUrl, userId]
            );
        }

        await connection.commit();
        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            profileUrl: req.file ? `/assets/profile-image/${req.file.filename}` : null
        });

    } catch (error) {
        await connection.rollback();
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    } finally {
        connection.release();
    }
  }

}

module.exports = UserController;
