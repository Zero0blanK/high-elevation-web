const db = require('../config/db');

class CartController {
  constructor() {
    this.addToCart = this.addToCart.bind(this);
    this.viewCart = this.viewCart.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
    this.updateQuantity = this.updateQuantity.bind(this);
    this.cartItemPayment = this.cartItemPayment.bind(this);
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
      res.json({ 
        success: true, 
        message: 'Product added to cart successfully!' 
      });


    } catch (err) {
      console.error('Error adding to cart:', err.message);
      res.status(500).json({ error: 'Error adding product to cart' });
    }
  }

  async viewCart(req, res) {
    const user_id = req.session.userId;

    try {
      const query = `
          SELECT 
              c.product_id, 
              c.weight_id, 
              c.quantity, 
              p.name, 
              p.image_url, 
              pw.price,
              pw.stock,
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
      
      // Ensure price is a number
      cartItems.forEach(item => {
        item.price = parseFloat(item.price);
        item.stock = parseInt(item.stock);
      });

      let subtotal = 0;
      cartItems.forEach(item => {
        subtotal += item.quantity * item.price;
      });

      if (req.route.path === '/cart') {
        res.render('cart', { 
          cartItems: cartItems || [],
          subtotal
        });
      } else {
        return cartItems;
      }

    } catch (err) {
      console.error('Error fetching cart items:', err.message);
    }
  }

  async removeFromCart(req, res) {
    const { product_id, weight_id } = req.body;
    const user_id = req.session.userId;

    const connection = await db.getConnection();
    try {
      connection.beginTransaction();
      await connection.query('DELETE FROM cart WHERE user_id = ? AND product_id = ? AND weight_id = ?', [
        user_id, product_id, weight_id
      ]);
      await connection.commit();
      res.json({ 
        success: true, 
        message: 'Product added to cart successfully!' 
      });
    } catch (err) {
      await connection.rollback();
      console.error('Error removing from cart:', err.message);
      res.status(500).json({ error: 'Error removing item from cart' });
    } finally {
      connection.release();
    }
  }

  async updateQuantity(req, res) {
    const { product_id, weight_id, quantity } = req.body;
    const user_id = req.session.userId;

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ? AND weight_id = ?',
        [quantity, user_id, product_id, weight_id]
      );

      await connection.commit();
      return res.json({ success: true, message: 'Quantity updated successfully' });

    } catch (err) {
      await connection.rollback();
      console.error('Error updating quantity:', err.message);
    } finally {
      connection.release();
    }
  }

  async cartItemPayment(req, res){
    const user_id = req.session.userId;
    const {address_id, payment_method} = req.body;
    const {product_id, weight_id, quantity} = req.query;
    const isBuyNow = req.query.buyNow === "true";


    if (!user_id || !address_id || !payment_method) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment. Address and payment method are required."
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction(); // 🛠 Start transaction
        let cartItems = [];
        if (isBuyNow) {
          // Process Buy Now: Get COMPLETE product details from the database
          const [product] = await connection.execute(`
              SELECT p.id AS product_id, p.name, p.image_url, pw.price, pw.stock,
                     w.value AS weight, w.unit, pc.name AS category_name
              FROM product_weight pw
              JOIN product p ON pw.product_id = p.id
              JOIN weight w ON pw.weight_id = w.id
              JOIN product_category pc ON p.category_id = pc.id
              WHERE pw.product_id = ? AND pw.weight_id = ?`,
              [product_id, weight_id]
          );
      
          if (product.length === 0) {
              await connection.rollback();
              return res.status(400).send("Invalid product selection.");
          }
      
          const item = {
              product_id,
              weight_id,
              quantity: parseInt(quantity),
              price: parseFloat(product[0].price),
              stock: parseInt(product[0].stock),
              product: product[0] // Add the full product object
          };
          if (item.quantity > item.stock) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              error: "Insufficient stock."
            });
          }
      
          cartItems.push(item);
      } else {
            // Process Cart Checkout
            [cartItems] = await connection.execute(`
                SELECT c.product_id, c.weight_id, c.quantity, pw.price, pw.stock
                FROM cart c
                JOIN product_weight pw ON c.product_id = pw.product_id AND c.weight_id = pw.weight_id
                WHERE c.user_id = ?`,
                [user_id]
            );

            if (cartItems.length === 0) {
                await connection.rollback();
                return res.status(400).send("Cart is empty.");
            }

            for (let item of cartItems) {
                if (item.quantity > item.stock) {
                    await connection.rollback();
                    return res.status(400).json({
                      success: false,
                      error: "Insufficient stock."
                    });
                }
            }
        }

      const shippingRate = 5 / 100;
      let totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * parseFloat(item.price), 0);
      totalAmount += totalAmount * shippingRate;
      
      const [orderResult] = await connection.execute(`
          INSERT INTO user_order (user_id, address_id, total_amount, order_date)
          VALUES (?, ?, ?, NOW())`,
          [user_id, address_id, totalAmount.toFixed(2)]
      );

      const userOrderId = orderResult.insertId;

      for (let item of cartItems) {
          await connection.execute(`
              INSERT INTO order_detail (user_order_id, product_id, quantity, weight_id)
              VALUES (?, ?, ?, ?)`,
              [userOrderId, item.product_id, item.quantity, item.weight_id]
          );

          await connection.execute(`
              UPDATE product_weight
              SET stock = stock - ?
              WHERE product_id = ? AND weight_id = ?`,
              [item.quantity, item.product_id, item.weight_id]
          );

          await connection.execute(`
              UPDATE product
              SET total_stock = total_stock - ?
              WHERE id = ?`,
              [item.quantity, item.product_id]
          );
      }

      await connection.execute(`
          INSERT INTO payment (order_id, payment_method)
          VALUES (?, ?)`,
          [userOrderId, payment_method]
      );

      if (!isBuyNow) {
        await connection.execute('DELETE FROM cart WHERE user_id = ?', [user_id]);
      }

      await connection.commit(); // ✅ Commit transaction

      res.json({
        success: true,
        orderId: userOrderId,
        message: 'Order placed successfully'
      });

    } catch (err) {
        await connection.rollback(); // ❌ Rollback on failure
        console.error('Error processing payment:', err.message);
        res.status(500).json({
          success: false,
          error: 'Error processing payment'
        });
    } finally {
        connection.release();
    }
  }

}

module.exports = new CartController();