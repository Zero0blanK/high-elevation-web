const db = require('../config/db');

class Product {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS product (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            image_url VARCHAR(255) NOT NULL,
            category_id INTEGER NOT NULL,
            total_stock INTEGER NOT NULL,
            is_deleted TINYINT NOT NULL DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES product_category(id) ON DELETE CASCADE
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('product table created successfully.');
        } catch (err) {
            console.error('Error creating product table:', err.message);
        }
    }

    async getAllProducts() {
        const query = 'SELECT * FROM products';
        try {
            const [rows] = await this.db.promise().query(query);
            return rows;
        } catch (err) {
            console.error('Error fetching products:', err.message);
            throw err;
        }
    }
}

module.exports = Product;