const db = require('../config/db');
const Product_Category = require('../models/Product_Category');

const productCategoryModel = new Product_Category(db);
productCategoryModel.createTable();
