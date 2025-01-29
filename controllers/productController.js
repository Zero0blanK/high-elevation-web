const Product = require('../models/Product');
const Category = require('../models/User');
const db = require('../config/db');

class ProductController {
  constructor() {
    this.productModel = new Product(db);
  }

  // Render the product page with products and categories
  async renderProductPage(req, res) {
    try {
      // Fetch data
      const products = await this.productModel.getAllProducts();
      const categories = await this.categoryModel.getAllCategories();  // Fetch categories

      // Render product page and pass both products and categories
      res.render('product', {
        title: 'Products',
        products: products,
        categories: categories
      });
    } catch (err) {
      console.error("Error fetching products and categories:", err);
      res.status(500).send("Internal Server Error");
    }
  }
}

module.exports = new ProductController();
