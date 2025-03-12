const db = require('../config/db');

class User {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS user (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(50) NOT NULL,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            contact_number VARCHAR(20),
            profile_pic_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('user table created successfully.');
        } catch (err) {
            console.error('Error creating user table:', err.message);
        }
    }

    

}

module.exports = User;