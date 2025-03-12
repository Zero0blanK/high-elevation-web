const db = require('../config/db');

class Inventory_Log {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS inventory_log (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            product_id INTEGER NOT NULL,
            weight_id INTEGER,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            quantity INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
            FOREIGN KEY (weight_id) REFERENCES weight(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('Inventory log table created successfully.');
        } catch (err) {
            console.error('Error creating product table:', err.message);
        }
    }
}

module.exports = Product;