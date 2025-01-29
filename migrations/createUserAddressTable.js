const db = require('../config/db');
const User_Address = require('../models/User_Address');

const userAddressModel = new User_Address(db);
userAddressModel.createTable();
