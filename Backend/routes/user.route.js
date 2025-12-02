const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const userAuth = require('../middleware/user.auth');
const multer = require('multer');
const RestaurantController = require("../controller/restaurant.controller");

const upload = multer({dest:'public/img/users/'});

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/profile', userAuth.authenticateUser, userController.getUserProfile);
router.post('/forgot-password',userAuth.forgotPassword);
router.patch('/reset-password/:token',userAuth.resetPassword);

//To update User Detail or address
router.patch('/update-address',userAuth.authenticateUser,userController.updateAddress);

//for updating user

router.patch('/update-picture', userAuth.authenticateUser,userController.updateUser, userController.resizeImage,userController.updateUserProfilePhoto);
router.get("/search",RestaurantController.search);
router.get("/nearby",userAuth.authenticateUser,userController.getNearByRestaurant);
router.get('/popularRestaurant',userController.popularRestaurants);


module.exports = router;