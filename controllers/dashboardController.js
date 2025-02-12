const Product = require('../models/Product');
const User_Order = require('../models/User_Order');

const db = require('../config/db');


class DashboardController {
  constructor() {
    this.productModel = new Product(db);
    this.userOrderModel = new User_Order(db);
    this.addProduct = this.addProduct.bind(this);
  }

  async getAllProducts() {
    const query = `
        SELECT p.id, p.name, p.image_url, p.description, p.category_id, p.stock, pc.name AS category_name,
               (SELECT pw.price 
                FROM product_weight pw 
                JOIN weight w ON pw.weight_id = w.id
                WHERE pw.product_id = p.id
                ORDER BY w.value ASC
                LIMIT 1) AS lowest_price
        FROM product p
        JOIN product_category pc ON p.category_id = pc.id
    `;
    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (err) {
        console.error('Error fetching products:', err.message);
        throw err;
    }
  }

  async getCategoryId(categoryName) {
    const [rows] = await db.query("SELECT id FROM product_category WHERE name = ?", [categoryName]);
    return rows.length > 0 ? rows[0].id : null;
  }

  async addProduct(req, res) {
    const { name, description, category } = req.body;

    // Normalize weights to always be an array
    const weights = Array.isArray(req.body.weights) ? req.body.weights : (req.body.weights ? [req.body.weights] : []);

    // Validate required fields
    if (!weights.length) {
        return res.status(400).json({ error: 'At least one weight is required.' });
    }

    const category_id = await this.getCategoryId(category);

    if (!category_id) {
        return res.status(400).json({ error: 'Invalid category.' });
    }

    const image_url = req.file ? `/assets/product-image/${req.file.filename}` : "/assets/product-image/default.jpg";

    try {
        let totalStock = 0;
        const productWeights = [];

        // Fetch weight IDs from `weight` table
        const [weightRows] = await db.query("SELECT id, value, unit FROM weight");
        const weightMap = {};
        weightRows.forEach(w => {
            weightMap[`${w.value}${w.unit}`] = w.id; // Mapping weight value + unit to ID
        });

        weights.forEach(weight => {
            const weightId = weightMap[weight];  // Corrected weight ID lookup

            const price = req.body[`price_${weight}`];
            const stock = req.body[`stock_${weight}`];

            console.log(`Weight: ${weight}, Price: ${price}, Stock: ${stock}, Weight ID: ${weightId}`);

            if (weightId && price && stock) {
                productWeights.push([name, image_url, description, category_id, price, stock, weightId]);
                totalStock += parseInt(stock);
            }
        });

        // Insert product into `product` table, using the total stock
        const [productResult] = await db.query(
            "INSERT INTO product (name, image_url, description, category_id, stock) VALUES (?, ?, ?, ?, ?)",
            [name, image_url, description, category_id, totalStock]
        );

        const productId = productResult.insertId;

        // Insert product_weight entries for each weight variant
        if (productWeights.length > 0) {
            const productWeightValues = productWeights.map(item => [productId, item[6], item[4], item[5]]);
            await db.query(
                "INSERT INTO product_weight (product_id, weight_id, price, stock) VALUES ?",
                [productWeightValues]
            );
        }

        res.redirect("/dashboard/products");
    } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).send("Error adding product");
    }
  }

  async deleteProductById(req, res) {
    const { productId } = req.params; // Get productId from the URL parameter

    try {
      // First, check if product exists
      const product = await db.query("SELECT * FROM product WHERE id = ?", [productId]);
      if (product.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Delete from product_weight table first (if any foreign key relations exist)
      await db.query("DELETE FROM product_weight WHERE product_id = ?", [productId]);

      // Now delete the product from the product table
      await db.query("DELETE FROM product WHERE id = ?", [productId]);

      res.status(200).json({success: true, message: 'Product deleted successfully' });
    } catch (err) {
      console.error("Error deleting product:", err);
      res.status(500).json({success: false, message: 'Error deleting product' });
    }
  }

  async getDashboardData() {
    const query =`
      SELECT 
          COALESCE(SUM(uo.total_amount), 0) AS totalSales,
          COALESCE(COUNT(uo.id), 0) AS totalOrders,
          COALESCE((SELECT COUNT(id) FROM user WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)), 0) AS newCustomers,
          COALESCE((SELECT (SUM(stock) / COUNT(id)) * 100 FROM product), 0) AS stockLevel
      FROM user_order uo
      WHERE uo.shipping_status = 'delivered';
    `;
    try {
      const [rows] = await db.query(query);
      console.log("Dashboard Data:", rows);
      return rows[0];

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
  };

}

module.exports = new DashboardController();
