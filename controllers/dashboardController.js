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
        SELECT p.id, p.name, p.image_url, p.description, p.category_id, p.total_stock, pc.name AS category_name,
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
            "INSERT INTO product (name, image_url, description, category_id, total_stock) VALUES (?, ?, ?, ?, ?)",
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
        -- Total sales only for delivered or paid orders
        COALESCE(
          SUM(
            CASE
              WHEN uo.shipping_status = 'delivered'
              OR uo.order_status = 'paid' THEN uo.total_amount
              ELSE 0
            END
          ),
          0
        ) AS totalSales,
        -- Count all orders regardless of status
        COALESCE(COUNT(uo.id), 0) AS totalOrders,
        -- Count new customers in the last month
        COALESCE(
          (
            SELECT
              COUNT(id)
            FROM
              user
            WHERE
              created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
          ),
          0
        ) AS newCustomers,
        -- Stock level as a percentage
        COALESCE(
          (
            SELECT
              ROUND((SUM(total_stock) / 100) * 100, 2)
            FROM
              product
          ),
          0
        ) AS stockLevel
      FROM
        user_order uo;
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

  // 📌 Fetch Orders with Filters
  async getOrders(req, res) {
    let { search, status, sort, page } = req.query;
    let limit = 10;
    let offset = (page - 1) * limit || 0;

    let whereClauses = [];
    let params = [];

    if (search) {
        whereClauses.push("(CONCAT(u.first_name, ' ', u.last_name) AS customer_name LIKE ? OR uo.id LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (status && status !== 'all') {
        whereClauses.push("uo.shipping_status = ?");
        params.push(status);
    }

    let orderBy = "uo.order_date DESC"; // Default sorting: Newest first
    if (sort === "oldest") orderBy = "uo.order_date ASC";
    if (sort === "highest") orderBy = "uo.total_amount DESC";
    if (sort === "lowest") orderBy = "uo.total_amount ASC";

    let whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
        SELECT uo.id AS order_id, CONCAT(u.first_name, " ", u.last_name) AS customer_name, 
                GROUP_CONCAT(p.name SEPARATOR ', ') AS products, 
                DATE_FORMAT(uo.order_date, '%M %d, %Y') AS order_date, uo.total_amount, uo.shipping_status
        FROM user_order uo
        JOIN user u ON uo.user_id = u.id
        JOIN order_detail od ON uo.id = od.user_order_id
        JOIN product p ON od.product_id = p.id
        ${whereSQL}
        GROUP BY uo.id
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?;
    `;

    try {
        const [orders] = await db.query(query, [...params, limit, offset]);

        const countQuery = `SELECT COUNT(*) AS total FROM user_order uo ${whereSQL}`;
        const [[{ total }]] = await db.query(countQuery, params);
        const totalPages = Math.ceil(total / limit);

        return {
          orders, 
          total,
          totalPages,
          page: page || 1, 
          limit, 
          searchQuery: search || '', 
          statusFilter: status || 'all', 
          sortFilter: sort || 'newest' 
          };
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

  // 📌 Edit Order Status
  async updateOrderStatus(req, res) {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!["pending", "processing", "shipped", "delivered"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
      }

      const query = `UPDATE user_order SET shipping_status = ? WHERE id = ?`;
      try {
          await db.query(query, [status, orderId]);
          res.json({ message: "Order status updated successfully" });
      } catch (error) {
          console.error("Error updating order status:", error);
          res.status(500).json({ error: "Internal server error" });
      }
  };

  // 📌 Delete Order
  async deleteOrder(req, res) {
      const { orderId } = req.params;

      try {
          await db.query(`DELETE FROM order_detail WHERE order_id = ?`, [orderId]);
          await db.query(`DELETE FROM user_order WHERE id = ?`, [orderId]);

          res.json({ message: "Order deleted successfully" });
      } catch (error) {
          console.error("Error deleting order:", error);
          res.status(500).json({ error: "Internal server error" });
      }
  }

}

module.exports = new DashboardController();
