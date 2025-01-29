const db = require('../config/db');
const Product = require('../models/Product');

const productModel = new Product(db);
productModel.createTable();
