require('./migrations/createUserTable');
require('./migrations/createUserAddressTable');
require('./migrations/createUserOrderTable');
require('./migrations/createProductCategoryTable');
require('./migrations/createProductTable');
require('./migrations/createCartTable');
require('./migrations/createOrderDetailTable');
require('./migrations/createPaymentTable');
require('./migrations/createReviewTable');
require('./migrations/createWeightTable');
require('./migrations/createProductWeightTable');


console.log("All migrations have been run successfully.");
