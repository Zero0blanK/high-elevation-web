const db = require('../config/db');
const Inventory_Log = require('../models/Inventory_Log');

const inventoryLogModel = new Inventory_Log(db);
inventoryLogModel.createTable();
