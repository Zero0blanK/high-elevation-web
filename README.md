# ☕ High Elevation Web

**High Elevation Web** is an e-commerce website built for selling premium coffee products. Developed as a school project, it provides a smooth shopping experience with user accounts, cart management, checkout flow, and product reviews — all built from scratch using Express.js and MySQL.

---

## 🌟 Features

- 🛍️ **Product Browsing**  
  Users can browse different coffee products by category, weight, and more.

- 🧺 **Shopping Cart System**  
  Add items to cart, manage quantities, and proceed to checkout.

- 💳 **Checkout & Payment**  
  Supports both cart-based and direct purchases. Users can complete orders easily.

- 📦 **Order Management**  
  Track past orders and see order status from the account dashboard.

- 📝 **Product Reviews**  
  Users can leave star ratings and written reviews after purchase.

- 🏠 **Address Management**  
  Each user can store one default shipping address for faster checkout.

---

## 🛠️ Built With

- **Express.js** – Backend server and routing
- **Node.js** – Runtime environment
- **MySQL** – Database for users, products, orders, and more
- **EJS / HTML / CSS / JS** – Frontend rendering and UI
- **XAMPP/WSL** – Local development environment
- **Session/Auth** – User login and access control
- 
---

## ⚙️ Getting Started

1. **Clone the project**:
   ```bash
   git clone https://github.com/yourusername/high-elevation-web.git
   cd high-elevation-web
   ```
2. **Install Dependency**
   ```bash
   npm install
   ```
3. **Set up .env**
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=high_elevation
   ```
4. Run database migrations:
   ```
   npm run migrate.js
   ```

5. Start the development server:
   ```
   npm run devStart
   ```


