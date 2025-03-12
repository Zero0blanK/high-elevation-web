const Product = require('../models/Product');
const db = require('../config/db');

class ProductController {
  constructor() {
    this.productModel = new Product(db);
  }
  async getAllProducts() {
    const query = `
        SELECT 
            p.id, 
            p.name, 
            p.image_url, 
            p.description, 
            pc.name AS category_name, 
            p.is_deleted,
            p.total_stock,
            (SELECT pw.price 
                FROM product_weight pw 
                JOIN weight w ON pw.weight_id = w.id 
                WHERE pw.product_id = p.id 
                ORDER BY w.value ASC 
                LIMIT 1) AS lowest_price,
            GROUP_CONCAT(JSON_OBJECT(
                'weight', w.value, 
                'unit', w.unit, 
                'price', pw.price, 
                'stock', pw.stock,
                'weight_id', pw.weight_id
            ) SEPARATOR ','
        ) AS weight_variants
        FROM product p
        JOIN product_category pc ON p.category_id = pc.id
        LEFT JOIN product_weight pw ON p.id = pw.product_id
        LEFT JOIN weight w ON pw.weight_id = w.id
        GROUP BY p.id
    `;

    try {
        const [products] = await db.query(query);
        return products;
    } catch (err) {
        console.error('Error fetching products:', err.message);
        throw err;
    }
  }

  async getTopProducts() {
    try {
        const [topProducts] = await db.query(`
            SELECT p.name, COUNT(od.product_id) AS sales 
            FROM order_detail od 
            JOIN product p ON od.product_id = p.id 
            GROUP BY od.product_id 
            ORDER BY sales DESC 
            LIMIT 3
        `);
        return topProducts || [];
    } catch (error) {
        console.error("Error fetching top products:", error);
        return [];
    }
    
}

  async getProductDetails(product_id, res) {
    try {
      const query = `
        SELECT
          r.rating,
          r.review_text AS content,
          r.review_title AS title,
          r.created_at,
          u.first_name
        FROM
          review r
          JOIN user u ON r.user_id = u.id
        WHERE
          r.product_id = ?
        ORDER BY
          r.created_at DESC
      `;

      const [productDetails] = await db.query(query, [product_id]);
      return productDetails || [];
    } catch (err) {
      console.error('Error fetching product details:', err.message);
    }
  }

// Function to calculate average rating from reviews
  async calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1); // One decimal place
  }
  // Function to count ratings by star level
  async getRatingDistribution(reviews) {
    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
      return distribution;
  }

  async addReview(req, res) {
    const user_id = req.session.userId;
    const product_id = req.body.product_id;
    const rating = parseInt(req.body.rating);
    const review_title = req.body.title;
    const review_text = req.body.content;

    if (!user_id) {
      req.flash('error', 'Please login to write a review');
      return res.redirect('back');
    }

    if (isNaN(rating) || rating < 1 || rating > 5) {
      req.flash('error', 'Invalid rating. Please select a rating between 1 and 5.');
      return res.redirect('back');
    }

    if (!review_title || !review_text) {
      req.flash('error', 'Title and review content are required.');
      return res.redirect('back');
    }

    // Check if the user has already reviewed this product
    const [reviewExists] = await db.query(
      'SELECT 1 FROM review WHERE user_id =? AND product_id =?',
      [user_id, product_id]
    );

    if (reviewExists.length > 0) {
      req.flash('error', 'You have already reviewed this product.');
      return res.redirect('back');
    }

    const connection = await db.getConnection();

    try {
      connection.beginTransaction();
      const query = `
        INSERT INTO review (user_id, product_id, rating, review_title, review_text)
        VALUES (?, ?, ?, ?, ?)
      `;

      const productQuery = `SELECT name FROM product WHERE id = ?`;
      const [productRows] = await connection.query(productQuery, [product_id]);

      await connection.query(query, [user_id, product_id, rating, review_title, review_text]);
      req.flash('success', 'Review added successfully!');
      await connection.commit();
      res.redirect(`/product/overview/${encodeURIComponent(productRows[0].name)}`);
    } catch (error) {
      await connection.rollback();
      console.error('Error adding review:', error);
      req.flash('error', 'Error adding review. Please try again.');
      res.redirect('back');
    } finally {
      connection.release();
    }
}

}

module.exports = new ProductController();
