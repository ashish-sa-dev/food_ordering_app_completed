const express = require('express');
const router = express.Router();
const userAuth = require('../middleware/user.auth');

const orderController = require('../controller/order.controller');


router.post("/place",userAuth.authenticateUser,orderController.placeOrder);
router.get('/my-orders',userAuth.authenticateUser,orderController.getUserOrders)


module.exports = router;