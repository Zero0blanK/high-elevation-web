require('./migrations/createUserTable');
require('./migrations/createUserAddressTable');
require('./migrations/createUserOrderTable');
require('./migrations/createProductCategoryTable');
require('./migrations/createProductTable');
require('./migrations/createCartTable');
require('./migrations/createOrderDetailTable');
require('./migrations/createPaymentTable');
require('./migrations/createReviewTable');


console.log("All migrations have been run successfully.");
