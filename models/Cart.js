const db = require('../config/db');
class Cart {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            product_id INT NOT NULL,
            weight_id INT NOT NULL,
            quantity INT NOT NULL CHECK(quantity > 0),
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
            FOREIGN KEY (weight_id) REFERENCES weight(id) ON DELETE CASCADE
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('cart table created successfully.');
        } catch (err) {
            console.error('Error creating cart table:', err.message);
        }
    }

}

module.exports = Cart;