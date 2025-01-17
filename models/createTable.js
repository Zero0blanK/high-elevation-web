const db = require('./db');

// Create tables
const createTables = () => {

    const orderTable = `
    CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(10,2),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`;

    const productTable = `
    CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(5,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        stock_quantity INT NOT NULL
    )`;

    const orderItemTable = `
    CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT,
        product_id INT,
        quantity INT,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`;

    const userTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        password VARCHAR(30) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        address VARCHAR(100) NOT NULL,
        contact_number VARCHAR(20),
        role ENUM('admin', 'barista', 'customer') DEFAULT 'customer'
    )`;

    const cartTable = `
    CREATE TABLE IF NOT EXISTS cart (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`;

    const cartItemTable = `
    CREATE TABLE IF NOT EXISTS cart_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cart_id INT,
        product_id INT,
        quantity INT,
        FOREIGN KEY (cart_id) REFERENCES cart(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`;

    const reviewTable = `
    CREATE TABLE IF NOT EXISTS reviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT,
        user_id INT,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        review TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`;


    db.query(orderTable);
    db.query(productTable);
    db.query(orderItemTable);
    db.query(userTable);
    db.query(cartTable);
    db.query(cartItemTable);
    db.query(reviewTable, (err) => {
        if (err) console.error("Error creating tables:", err);
        else console.log("Tables created successfully!");
        db.end(); // Close connection after setup
    });
};

createTables();
