const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// Session setup
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', './views'); // 

// Serve static files (CSS, JS, images)
app.use(express.static('public'));


// Routes Files
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/product', productRoutes);



// ✅ Home route (renders index.ejs)
app.get('/', (req, res) => {
    res.render('index', { 
      title: 'Welcome to High Elevation Web' });
});

// Route for Menu Page
app.get('/menu', (req, res) => {
  res.render('menu', { title: 'Menu' });
});

// Route for About Page
app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

// Route for Product Page
app.get('/cart', (req, res) => {
  res.render('cart', { title: 'Your Shopping Cart' });
});
// Route for Product Page
app.get('/overview', (req, res) => {
  res.render('overview', { title: 'Overview' });
});
// Route for Product Page
app.get('/profile', (req, res) => {
  res.render('profile', { title: 'Overview' });
});


// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
