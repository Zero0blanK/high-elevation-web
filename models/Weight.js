const db = require('../config/db');
class Weight {
    constructor(db) {
        this.db = db;
    }

    async createTable() {
        const query = `
        CREATE TABLE IF NOT EXISTS weight (
            id INTEGER PRIMARY KEY AUTO_INCREMENT,
            value INT NOT NULL,
            unit VARCHAR(5) NOT NULL
        )
        `;
        try {
            await this.db.query(query); // Use await for promise resolution
            console.log('weight table created successfully.');
        } catch (err) {
            console.error('Error creating weight table:', err.message);
        }
    }

}

module.exports = Weight;