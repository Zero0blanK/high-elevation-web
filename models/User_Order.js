const db = require('../config/db');
class User_Order {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS user_order (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            address_id INT NOT NULL,
            shipping_status ENUM('pending', 'shipped', 'delivered') DEFAULT 'pending',
            total_amount DECIMAL(10, 2) NOT NULL,
            order_status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
            FOREIGN KEY (address_id) REFERENCES user_address(id) ON DELETE CASCADE
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('user_order table created successfully.');
        } catch (err) {
            console.error('Error creating user_order table:', err.message);
        }
    }

}

module.exports = User_Order;