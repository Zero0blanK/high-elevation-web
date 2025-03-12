const db = require('../config/db');

class User_Address {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS user_address (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            street_address VARCHAR(255) NOT NULL,
            apartment VARCHAR(100),
            city VARCHAR(50) NOT NULL,
            zip_code VARCHAR(10) NOT NULL,
            is_default TINYINT NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('user_address table created successfully.');
        } catch (err) {
            console.error('Error creating user_address table:', err.message);
        }
    }

}

module.exports = User_Address;