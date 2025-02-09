const db = require('../config/db');

class CartController {
  constructor() {
    this.addToCart = this.addToCart.bind(this);
    this.viewCart = this.viewCart.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
    this.updateQuantity = this.updateQuantity.bind(this);
  }

  async addToCart(req, res) {
    const { product_id, weight_id, quantity } = req.body;
    const user_id = req.session.userId;

    if (!user_id) {
      return res.render('cart', { cartItems: [] });
    }

    try {
      const [existingCartItem] = await db.query(
        'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND weight_id = ?',
        [user_id, product_id, weight_id]
      );

      if (existingCartItem.length > 0) {
        await db.query(
          'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND weight_id = ?',
          [quantity, user_id, product_id, weight_id]
        );
      } else {
        await db.query(
          'INSERT INTO cart (user_id, product_id, weight_id, quantity) VALUES (?, ?, ?, ?)',
          [user_id, product_id, weight_id, quantity]
        );
      }
      res.redirect('/cart')

    } catch (err) {
      console.error('Error adding to cart:', err.message);
      res.status(500).json({ error: 'Error adding product to cart' });
    }
  }

  async viewCart(req, res) {
    const user_id = req.session.userId;

    if (!user_id) {
      return res.status(401).json({ error: 'User not logged in' });
    }

    try {
      const query = `
          SELECT 
              c.product_id, 
              c.weight_id, 
              c.quantity, 
              p.name, 
              p.image_url, 
              pw.price, 
              w.value AS weight, 
              w.unit, 
              pc.name AS category_name
          FROM cart c
          JOIN product p ON c.product_id = p.id
          JOIN product_weight pw ON c.weight_id = pw.weight_id AND c.product_id = pw.product_id
          JOIN weight w ON pw.weight_id = w.id
          JOIN product_category pc ON p.category_id = pc.id
          WHERE c.user_id = ?;
      `;

      const [cartItems] = await db.query(query, [user_id]);

      let subtotal = 0;
      cartItems.forEach(item => {
        subtotal += item.quantity * item.price;
      });

      res.render('cart', { cartItems: cartItems || [], subtotal });
    } catch (err) {
      console.error('Error fetching cart items:', err.message);
    }
  }

  async removeFromCart(req, res) {
    const { product_id, weight_id } = req.body;
    const user_id = req.session.userId;

    if (!user_id) {
      return res.status(401).json({ error: 'User not logged in' });
    }

    try {
      await db.query('DELETE FROM cart WHERE user_id = ? AND product_id = ? AND weight_id = ?', [
        user_id, product_id, weight_id
      ]);

      res.redirect('/cart')
    } catch (err) {
      console.error('Error removing from cart:', err.message);
      res.status(500).json({ error: 'Error removing item from cart' });
    }
  }

  async updateQuantity(req, res) {
    const { product_id, weight_id, quantity } = req.body;
    const user_id = req.session.userId;

    if (!user_id) {
      return res.status(401).json({ error: 'User not logged in' });
    }

    try {
      await db.query(
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ? AND weight_id = ?',
        [quantity, user_id, product_id, weight_id]
      );

    } catch (err) {
      console.error('Error updating quantity:', err.message);
      res.status(500).json({ error: 'Error updating quantity' });
    }
  }
  

}

module.exports = new CartController();