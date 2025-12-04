const express = require('express');
const router = express.Router();
const RestaurantController = require('../controller/restaurant.controller');
const RestaurantAuth = require('../middleware/restaurant.auth');

router.post(
  '/register',
  RestaurantController.uploadRestaurantImage,
  RestaurantController.resizeUploadedImage,
  RestaurantController.registerRestaurant,
);
router.post('/login', RestaurantController.loginRestaurant);
router.get('/profile', RestaurantAuth.authenticateRestaurant, RestaurantController.profile);

router.post('/forgot-password', RestaurantAuth.forgotPassword);
router.patch('/reset-password/:token', RestaurantAuth.resetPassword);

router.get(
  '/orders',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.getRestaurantOrders,
);

// Get orders by status
router.get(
  '/orders/status/:status',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.getRestaurantOrdersByStatus,
);

// Update order status
router.put(
  '/orders/:orderId/status',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.updateOrderStatus,
);

// Get order counts by status
router.get(
  '/orders/counts',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.getOrderCounts,
);

router.get('/:id', RestaurantController.getRestaurantDetails);
router.patch(
  '/update-picture',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.updateRestaurant,
  RestaurantController.resizeImage,
  RestaurantController.updateRestaurantProfilePhoto,
);

router.post(
  '/add/menuItem',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.uploadMenuImage,
  RestaurantController.resizeMenuImage,
  RestaurantController.addMenuItem,
);
router.get(
  '/get/menuItems',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.getMenuItems,
);
router.delete(
  '/delete/menuItem/:id',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.deleteMenuItem,
);
router.post(
  '/logout',
  RestaurantAuth.authenticateRestaurant,
  RestaurantController.logoutRestaurant,
);

//Routes for MenuItems

module.exports = router;
