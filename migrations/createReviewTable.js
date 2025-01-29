const db = require('../config/db');
const Review = require('../models/Review');

const reviewModel = new Review(db);
reviewModel.createTable();
