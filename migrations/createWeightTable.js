const db = require('../config/db');
const Weight = require('../models/Weight');

const weightModel = new Weight(db);
weightModel.createTable();
