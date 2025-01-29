const db = require('../config/db');

class Payment {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS payment (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            order_id INT NOT NULL,
            payment_method ENUM('cash_on_delivery', 'e-wallet') NOT NULL,
            payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending'
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('payment table created successfully.');
        } catch (err) {
            console.error('Error creating payment table:', err.message);
        }
    }

}

module.exports = Payment;