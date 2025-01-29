const db = require('../config/db');
const Payment = require('../models/Payment');

const paymentModel = new Payment(db);
paymentModel.createTable();
