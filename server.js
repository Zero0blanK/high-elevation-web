const express = require('express');
const app = express();
// const productRoutes = require('./routes/products');
// const orderRoutes = require('./routes/orders');

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', './views'); // Specify the views folder

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images)
app.use(express.static('public'));

// Route files
// app.use('/products', productRoutes);
// app.use('/orders', orderRoutes);

// ✅ Home route (renders index.ejs)
app.get('/', (req, res) => {
    res.render('index', { title: 'Welcome to High Elevation Web' });
});

// Route for Product Page
app.get('/product', (req, res) => {
  res.render('product', { title: 'Products' });
});

// Route for Product Page
app.get('/menu', (req, res) => {
  res.render('menu', { title: 'Products' });
});

// Route for Product Page
app.get('/about', (req, res) => {
  res.render('product', { title: 'Products' });
});


// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
