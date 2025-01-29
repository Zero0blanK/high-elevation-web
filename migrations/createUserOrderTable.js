const db = require('../config/db');
const User_Order = require('../models/User_Order');

const userOrderModel = new User_Order(db);
userOrderModel.createTable();
