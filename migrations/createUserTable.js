const db = require('../config/db');
const User = require('../models/User');

const userModel = new User(db);
userModel.createTable();
