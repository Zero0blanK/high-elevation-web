const Product = require('../models/Product');
const db = require('../config/db');

class ProductController {
  constructor() {
    this.productModel = new Product(db);
  }

  async getAllProducts() {
    const query = 'SELECT * FROM product';
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
