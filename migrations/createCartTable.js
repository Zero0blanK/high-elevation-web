const db = require('../config/db');
const Cart = require('../models/Cart');

const cartModel = new Cart(db);
cartModel.createTable();
