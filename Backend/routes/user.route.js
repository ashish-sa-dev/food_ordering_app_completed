const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const userAuth = require('../middleware/user.auth');
const RestaurantController = require('../controller/restaurant.controller');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests per IP
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

router.post('/register', authLimiter, userController.registerUser);
router.post('/login', authLimiter, userController.loginUser);
router.get('/profile', userAuth.authenticateUser, userController.getUserProfile);
router.post('/forgot-password', authLimiter, userAuth.forgotPassword);
router.patch('/reset-password/:token', userAuth.resetPassword);

//To update User Detail or address
router.patch('/update-address', userAuth.authenticateUser, userController.updateAddress);

//for updating user

router.patch(
  '/update-picture',
  userAuth.authenticateUser,
  userController.updateUser,
  userController.resizeImage,
  userController.updateUserProfilePhoto,
);
router.get('/search', RestaurantController.search);
router.get('/nearby', userAuth.authenticateUser, userController.getNearByRestaurant);
router.get('/popularRestaurant', userController.popularRestaurants);

module.exports = router;
