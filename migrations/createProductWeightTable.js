const db = require('../config/db');
const Product_Weight = require('../models/Product_Weight');

const productWeightModel = new Product_Weight(db);
productWeightModel.createTable();
