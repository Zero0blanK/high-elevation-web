const db = require('../config/db');
class Product_Weight {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS product_weight (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            product_id INT NOT NULL,
            weight_id INT NOT NULL,
            price DECIMAL(6,2) NOT NULL,
            stock INT NOT NULL,
            is_deleted TINYINT NOT NULL DEFAULT 0,
            FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
            FOREIGN KEY (weight_id) REFERENCES weight(id) ON DELETE CASCADE
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('product_weight table created successfully.');
        } catch (err) {
            console.error('Error creating product_weight table:', err.message);
        }
    }

}

module.exports = Product_Weight;