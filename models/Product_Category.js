const db = require('../config/db');

class Product_Category {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS product_category (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL UNIQUE
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('product_category table created successfully.');
        } catch (err) {
            console.error('Error creating product_category table:', err.message);
        }
    }

}

module.exports = Product_Category;