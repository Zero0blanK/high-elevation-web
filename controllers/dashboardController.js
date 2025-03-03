const Product = require('../models/Product');
const User_Order = require('../models/User_Order');

const db = require('../config/db');


class DashboardController {
  constructor() {
    this.productModel = new Product(db);
    this.userOrderModel = new User_Order(db);
    this.addProduct = this.addProduct.bind(this);
    this.getWeightId = this.getWeightId.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
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

  async getProductById(productId) {
    const query = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.category_id,
        pc.name AS category_name,
        pw.weight_id,
        w.value,
        w.unit,
        pw.price,
        pw.stock
      FROM
        product p
        JOIN product_category pc ON p.category_id = pc.id
        LEFT JOIN product_weight pw ON p.id = pw.product_id
        LEFT JOIN weight w ON pw.weight_id = w.id
      WHERE
        p.id = ?
    `;
    try {
        const [rows] = await db.query(query, [productId]);
        if (rows.length === 0) {
            throw new Error('Product not found');
        }

        const product = {
            id: rows[0].id,
            name: rows[0].name,
            description: rows[0].description,
            image_url: rows[0].image_url,
            category_id: rows[0].category_id,
            category_name: rows[0].category_name,
            weights: rows.map(row => ({
                weight_id: row.weight_id,
                value: row.value,
                unit: row.unit,
                price: row.price,
                stock: row.stock
            }))
        };

        return product;
    } catch (error) {
        console.error('Error fetching product details:', error);
        throw error;
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

  async getWeightId(weight) {
    const [rows] = await db.query('SELECT id FROM weight WHERE CONCAT(value, unit) = ?', [weight]);
    if (rows.length === 0) {
        throw new Error('Weight not found');
    }
    return rows[0].id;
  }

  async updateProduct(productData) {
    const { id, name, description, category, weights } = productData;
    const image = productData.image && productData.image !== '' ? productData.image : null;
    

    console.log("updateProduct image:", productData.image);

    // Fetch the category_id based on the category name
    const [categoryRows] = await db.query('SELECT id FROM product_category WHERE name = ?', [category]);
    if (categoryRows.length === 0) {
        throw new Error('Category not found');
    }
    const category_id = categoryRows[0].id;

    const updateProductQuery = `
        UPDATE product
        SET name = ?, description = ?, category_id = ?, image_url = COALESCE(?, image_url), total_stock = ?
        WHERE id = ?
    `;

    const updateWeightQuery = `
        INSERT INTO product_weight (product_id, weight_id, price, stock)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE price = VALUES(price), stock = VALUES(stock)
    `;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Calculate total stock
      let totalStock = 0;
      for (const weight of weights) {
        const stock = parseInt(productData[`stock_${weight}`], 10);
        totalStock += stock;
      }

      await connection.query(updateProductQuery, [name, description, category_id, image, totalStock, id]);

      for (const weight of weights) {
        const weightId = await this.getWeightId(weight);
        const price = productData[`price_${weight}`];
        const stock = productData[`stock_${weight}`];
        await connection.query(updateWeightQuery, [id, weightId, price, stock]);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
        console.error('Error updating product:', error);
        throw error;
    } finally {
      connection.release();
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
    page = parseInt(page) || 1;
    let limit = 10;
    let offset = (page - 1) * limit || 0;

    let whereClauses = [];
    let params = [];

    if (search) {
        whereClauses.push("(CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR uo.id LIKE ?)");
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

        const countQuery = `
          SELECT COUNT(*) AS total 
          FROM user_order uo 
          JOIN user u ON uo.user_id = u.id
          JOIN order_detail od ON uo.id = od.user_order_id
          JOIN product p ON od.product_id = p.id
        ${whereSQL}`;
        const [[{ total }]] = await db.query(countQuery, params);
        const totalPages = Math.ceil(total / limit);

        const shippingRate = 0.05;

        return {
          orders,
          shippingRate,
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

  // 📌 Fetch orders by id
  async getOrderById(orderId) {
    const query = `
      SELECT
          uo.id AS order_id,
          uo.shipping_status,
          uo.order_status,
          CONCAT(u.first_name, " ", u.last_name) AS customer_name,
          u.contact_number,
          CONCAT(ua.street_address, ', ', ua.city, ', ', ua.zip_code) AS address,
          pmt.payment_method,
          pmt.payment_status,
          DATE_FORMAT(uo.order_date, '%M %d, %Y') AS order_date,
          uo.total_amount,
          p.name,
          pc.name AS category,
          w.value AS weight,
          w.unit,
          od.quantity,
          pw.price,
          (od.quantity * pw.price) AS subtotal
      FROM
          user_order uo
          JOIN user u ON uo.user_id = u.id
          JOIN user_address ua ON uo.address_id = ua.id
          JOIN order_detail od ON uo.id = od.user_order_id
          JOIN product p ON od.product_id = p.id
          JOIN product_category pc ON p.category_id = pc.id
          JOIN product_weight pw ON p.id = pw.product_id AND od.weight_id = pw.weight_id
          JOIN weight w ON pw.weight_id = w.id
          JOIN payment pmt ON uo.id = pmt.order_id
      WHERE
          uo.id = ?;
    `;
    try {
      const [rows] = await db.query(query, [orderId]);
      if (rows.length === 0) {
          throw new Error('Order not found');
      }
      const shippingRate = 0.05;

      const order = {
        order_id: rows[0].order_id,
        shipping_status: rows[0].shipping_status,
        order_status: rows[0].order_status,
        customer_name: rows[0].customer_name,
        contact_number: rows[0].contact_number,
        address: rows[0].address,
        payment_method: rows[0].payment_method,
        payment_status: rows[0].payment_status,
        order_date: rows[0].order_date,
        total_amount: rows[0].total_amount,
        shipping_fee: parseFloat(rows[0].total_amount) * shippingRate,
        products: rows.map(row => ({
            name: row.name,
            category: row.category,
            weight: `${row.weight}${row.unit}`,
            quantity: row.quantity,
            price: row.price,
            subtotal: row.subtotal
        }))

      };
      return order;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  }

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

  async getSalesData(req, res) {
    try {
        // Get total sales per month (for Sales Overview chart)
        const salesOverviewQuery = `
          SELECT
            m.month_name AS MONTH,
            COALESCE(SUM(uo.total_amount), 0) AS total_sales
          FROM
            (
              SELECT
                'January' AS month_name,
                1 AS month_num
              UNION ALL
              SELECT
                'February',
                2
              UNION ALL
              SELECT
                'March',
                3
              UNION ALL
              SELECT
                'April',
                4
              UNION ALL
              SELECT
                'May',
                5
              UNION ALL
              SELECT
                'June',
                6
              UNION ALL
              SELECT
                'July',
                7
              UNION ALL
              SELECT
                'August',
                8
              UNION ALL
              SELECT
                'September',
                9
              UNION ALL
              SELECT
                'October',
                10
              UNION ALL
              SELECT
                'November',
                11
              UNION ALL
              SELECT
                'December',
                12
            ) AS m
            LEFT JOIN user_order uo ON MONTH(uo.order_date) = m.month_num
            AND YEAR(uo.order_date) = YEAR(CURDATE())
            AND uo.shipping_status = 'delivered' OR uo.order_status = 'paid'
          GROUP BY
            m.month_name,
            m.month_num
          ORDER BY
            m.month_num;
        `;

        const [salesOverview] = await db.query(salesOverviewQuery);

        // Get total sales by category (for Sales by Category chart)
        const categorySalesQuery = `
          SELECT
            c.name AS category,
            COALESCE(
              SUM(
                CASE
                  WHEN uo.shipping_status = 'delivered' OR uo.order_status = 'paid' THEN od.quantity * pw.price
                  ELSE 0
                END
              ),
              0
            ) AS total_sales
          FROM
            product_category c
            LEFT JOIN product p ON c.id = p.category_id
            LEFT JOIN product_weight pw ON p.id = pw.product_id
            LEFT JOIN order_detail od ON pw.product_id = od.product_id
            AND pw.weight_id = od.weight_id
            LEFT JOIN user_order uo ON od.user_order_id = uo.id
            AND YEAR(uo.order_date) = YEAR(CURDATE()) -- Keeps only current year's orders
          GROUP BY
            c.id
          ORDER BY
            total_sales DESC;
        `;

        const [categorySales] = await db.query(categorySalesQuery);

        return { salesOverview, categorySales };
    } catch (error) {
        console.error('Error fetching sales data:', error);
        throw error;
    }
  }

  async getInventoryData(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const params = [];
      
      // Handle search
      if (req.query.search) {
          whereClause += ' WHERE (p.name LIKE ? OR u.first_name LIKE ? OR il.details LIKE ?)';
          const searchTerm = `%${req.query.search}%`;
          params.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Handle action filter
      if (req.query.action && req.query.action !== 'all') {
          whereClause += whereClause ? ' AND' : ' WHERE';
          whereClause += ' il.action = ?';
          params.push(req.query.action.replace('-', ' ').toUpperCase());
      }
      
      // Handle sorting
      const sortOrder = req.query.sort === 'oldest' ? 'ASC' : 'DESC';
      
      const query = `
          SELECT
              il.*,
              p.name AS product_name,
              w.value AS weight,
              w.unit,
              u.first_name,
              p.image_url
          FROM
              inventory_log il
              JOIN product p ON il.product_id = p.id
              LEFT JOIN weight w ON il.weight_id = w.id
              JOIN user u ON il.user_id = u.id
          ${whereClause}
          ORDER BY
              il.created_at ${sortOrder}
          LIMIT ? OFFSET ?
      `;

      const countQuery = `
          SELECT COUNT(*) as total 
          FROM inventory_log il
          JOIN product p ON il.product_id = p.id
          JOIN user u ON il.user_id = u.id
          ${whereClause}
      `;

      const [inventoryLogs] = await db.query(query, [...params, limit, offset]);
      const [[{ total }]] = await db.query(countQuery, params);
      
      const totalPages = Math.ceil(total / limit);

      res.render('dashboard-inventory', {
          inventoryLogs,
          currentPage: page,
          totalPages,
          totalLogs: total,
          searchQuery: req.query.search || '',
          actionFilter: req.query.action || 'all',
          sortOption: req.query.sort || 'newest'
      });

  } catch (err) {
      console.error('Error fetching inventory data:', err);
      res.status(500).render('error', { error: 'Error loading inventory data' });
  }
  }

  async updateUserOrderStatus(req, res) {
    const { orderId, status } = req.body;

    try {
        // Begin transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update shipping status
            await connection.query(
                'UPDATE user_order SET shipping_status = ? WHERE id = ?',
                [status, orderId]
            );
            
            // Update order status based on shipping status
            let orderStatus;

            if (status === 'processing' || status === 'shipped') {
                orderStatus = 'processing';
            } else if (status === 'delivered') {
                orderStatus = 'delivered';
            } 

            // Update order status to confirmed if status is processing
            if (orderStatus) {
                await connection.query(
                    'UPDATE user_order SET order_status = ? WHERE id = ?',
                    [orderStatus, orderId]
                );
            }

            await connection.commit();
            
            res.json({
              success: true,
              message: status === 'processing' 
                  ? 'Order accepted successfully'
                  : status === 'shipped'
                  ? 'Order shipped successfully'
                  : 'Order status updated successfully'
          });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status'
        });
    }
  }

  async getProductInventory() {
    const query = `
      SELECT
        p.id as product_id,
        p.name,
        p.image_url,
        p.description,
        pc.name as category_name,
        pw.weight_id,
        w.value as weight_value,
        w.unit as weight_unit,
        pw.price,
        pw.stock,
        il.created_at as last_updated
      FROM
        product p
        JOIN product_category pc ON p.category_id = pc.id
        JOIN product_weight pw ON p.id = pw.product_id
        JOIN weight w ON pw.weight_id = w.id
        LEFT JOIN inventory_log il ON pw.product_id = il.product_id
        AND pw.weight_id = il.weight_id
        AND il.created_at = (
          SELECT
            MAX(created_at)
          FROM
            inventory_log
          WHERE
            product_id = p.id
            AND weight_id = pw.weight_id
        )
      ORDER BY
        p.name,
        w.value
      `;
  
    const [products] = await db.query(query);
    return products;
  }
  
  async processStockOperation(items, operation, userId) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
  
      for (const item of items) {
        // Update product_weight stock
        const stockChange = operation === 'stock-in' ? item.quantity : -item.quantity;

        await connection.query(`
          UPDATE product_weight 
          SET stock = stock + ? 
          WHERE product_id = ? AND weight_id = ?`,
          [stockChange, item.productId, item.weightId]
        );

        // Then calculate and update total stock in product table
        const [weightStocks] = await connection.query(`
          SELECT SUM(stock) as total_stock 
          FROM product_weight 
          WHERE product_id = ?`,
          [item.productId]
        );
        await connection.query(`
          UPDATE product 
          SET total_stock = ? 
          WHERE id = ?`,
          [weightStocks[0].total_stock, item.productId]
        );

        // Create inventory log entry
        await connection.query(`
          INSERT INTO inventory_log 
          (product_id, weight_id, user_id, action, quantity, details)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            item.productId, 
            item.weightId,
            userId,
            operation === 'stock-in' ? 'Stock In' : 'Stock Out',
            Math.abs(stockChange),
            `${operation === 'stock-in' ? 'Added' : 'Removed'} ${item.quantity} units`
          ]
        );
      }
  
      await connection.commit();
      return { success: true };
  
    } catch (error) {
      await connection.rollback();
      console.error('Stock operation error:', error);
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }
  
  // Supporting functions
  async getCategories() {
    const [categories] = await db.query('SELECT id, name FROM product_category');
    return categories;
  }
  
  async getInventoryLogs(productId) {
    const query = `
      SELECT 
        il.*,
        u.first_name,
        u.last_name,
        w.value as weight_value,
        w.unit as weight_unit
      FROM inventory_log il
      JOIN user u ON il.user_id = u.id
      LEFT JOIN weight w ON il.weight_id = w.id
      WHERE il.product_id = ?
      ORDER BY il.created_at DESC`;
  
    const [logs] = await db.query(query, [productId]);
    return logs;
  }
  
}

module.exports = new DashboardController();
