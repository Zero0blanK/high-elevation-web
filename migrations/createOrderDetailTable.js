const db = require('../config/db');
const Order_Detail = require('../models/Order_Detail');

const orderDetailModel = new Order_Detail(db);
orderDetailModel.createTable();
