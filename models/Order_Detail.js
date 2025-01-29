const db = require('../config/db');

class Order_Detail {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS order_detail (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            user_order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL CHECK(quantity > 0),
            price DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (user_order_id) REFERENCES user_order(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('order_detail table created successfully.');
        } catch (err) {
            console.error('Error creating order_detail table:', err.message);
        }
    }

}

module.exports = Order_Detail;