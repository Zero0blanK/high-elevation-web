const Product = require('../models/Product');
const db = require('../config/db');

class ProductController {
  constructor() {
    this.productModel = new Product(db);
  }
  async getAllProducts() {
    const query = `
        SELECT p.id, p.name, p.image_url, p.description, p.category_id, p.stock,
              pw.weight_id, 
              (SELECT pw_inner.price 
                FROM product_weight pw_inner
                JOIN weight w_inner ON pw_inner.weight_id = w_inner.id
                WHERE pw_inner.product_id = p.id
                ORDER BY w_inner.value ASC
                LIMIT 1) AS lowest_price
        FROM product p
        JOIN product_weight pw ON pw.product_id = p.id
        JOIN weight w ON pw.weight_id = w.id
        WHERE pw.weight_id = (
            SELECT pw_inner.weight_id
            FROM product_weight pw_inner
            JOIN weight w_inner ON pw_inner.weight_id = w_inner.id
            WHERE pw_inner.product_id = p.id
            ORDER BY w_inner.value ASC
            LIMIT 1
        )
    `;

    try {
        const [rows] = await db.query(query);
        return rows;
    } catch (err) {
        console.error('Error fetching products:', err.message);
        throw err;
    }
  }


}

module.exports = new ProductController();
