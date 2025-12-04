// controllers/restaurant.controller.js
const logger = require('../config/logger');
const Restaurant = require('../models/restaurant.model');
const MenuItem = require('../models/menuItem.model');
const Order = require('../models/order.model');
const { getCoordinates } = require('../utils/geocode');
const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

module.exports.uploadRestaurantImage = upload.single('photo');

module.exports.resizeUploadedImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    req.file.filename = `restaurant-${req.body.email}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/restaurant/${req.file.filename}`);

    next();
  } catch (err) {
    logger.error('resizeUploadedImage failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.registerRestaurant = async (req, res, next) => {
  try {
    const { name, email, password, description, cuisineType, address } = req.body;

    // Parse address if it's a string (from JSON.stringify)
    let addressObj;
    if (typeof address === 'string') {
      try {
        addressObj = JSON.parse(address);
      } catch {
        logger.warn('registerRestaurant invalid address format', { email });
        return res.status(400).json({ message: 'Invalid address format' });
      }
    } else {
      addressObj = address;
    }

    const existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant) {
      logger.warn('registerRestaurant attempt when already exists', { email });
      return res.status(400).json({ message: 'Restaurant already exists' });
    }

    if (!password || password.length < 6) {
      logger.warn('registerRestaurant weak password', { email });
      return res.status(400).json({ message: 'Minimum 6 characters required for password' });
    }

    const hashedPassword = await Restaurant.hashPassword(password);

    const fullAddress = `${addressObj.street}, ${addressObj.city}, ${addressObj.state}, ${addressObj.pincode}`;

    const coordinates = await getCoordinates(fullAddress);

    if (!coordinates) {
      logger.warn('registerRestaurant could not get coordinates', {
        fullAddress,
      });
      return res.status(400).json({ message: 'Could not get coordinates' });
    }

    const restaurantAddress = {
      street: addressObj.street,
      city: addressObj.city,
      state: addressObj.state,
      pincode: addressObj.pincode,
      location: {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude],
      },
    };

    const newRestaurant = await Restaurant.create({
      name,
      email,
      password: hashedPassword,
      description,
      cuisineType,
      address: restaurantAddress,
      image: req.file ? req.file.filename : 'default-restaurant.jpeg',
    });

    const token = newRestaurant.generateAuthToken();

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    logger.info('Restaurant registered', {
      restaurantId: newRestaurant._id,
      email,
    });

    return res.status(201).json({
      message: 'Restaurant registered successfully',
      restaurant: newRestaurant,
      token,
    });
  } catch (err) {
    logger.error('registerRestaurant failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
      body: req.body,
    });
    next(err);
  }
};

module.exports.loginRestaurant = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const restaurant = await Restaurant.findOne({ email }).select('+password');
    if (!restaurant) {
      logger.warn('loginRestaurant invalid credentials', { email });
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await restaurant.comparePassword(password);
    if (!isMatch) {
      logger.warn('loginRestaurant invalid credentials', { email });
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = restaurant.generateAuthToken();
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    logger.info('Restaurant login success', {
      restaurantId: restaurant._id,
      email,
    });

    return res.status(200).json({ message: 'Login success', restaurant, token });
  } catch (err) {
    logger.error('loginRestaurant failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.profile = async (req, res) => {
  // protected route => no try/catch needed; if something throws it will bubble to global handler
  return res.status(200).json({ message: 'From protected route', restaurant: req.restaurant });
};

module.exports.search = async (req, res, next) => {
  try {
    const query = req.query.query;

    if (!query) {
      logger.warn('search called without query');
      return res.status(400).json({ message: 'query is required to search' });
    }

    const restaurantsByName = await Restaurant.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } },
    ).sort({ score: { $meta: 'textScore' } });

    const menuItems = await MenuItem.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .populate('restaurant');

    const restaurantsFromMenu = [
      ...new Map(menuItems.map((item) => [item.restaurant._id, item.restaurant])).values(),
    ];

    const allRestaurants = [
      ...new Map(
        [...restaurantsByName, ...restaurantsFromMenu].map((r) => [r._id.toString(), r]),
      ).values(),
    ];

    logger.info('search completed', { query, results: allRestaurants.length });

    return res.status(200).json({
      total: allRestaurants.length,
      restaurants: allRestaurants,
    });
  } catch (err) {
    logger.error('search failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.getRestaurantDetails = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;

    const restaurant = await Restaurant.findById(restaurantId).populate('menuItems');

    if (!restaurant) {
      logger.warn('getRestaurantDetails not found', { restaurantId });
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    return res.status(200).json({
      message: 'Restaurant details fetched',
      restaurant,
    });
  } catch (err) {
    logger.error('getRestaurantDetails failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

// To upload and resize user profile photo
module.exports.updateRestaurant = upload.single('photo');

module.exports.resizeImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    req.file.filename = `restaurant-${req.restaurant._id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/restaurant/${req.file.filename}`);

    next();
  } catch (err) {
    logger.error('resizeImage failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.updateRestaurantProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      logger.warn('updateRestaurantProfilePhoto no file uploaded', {
        restaurantId: req.restaurant?._id,
      });
      return res.status(400).json({ message: 'please upload image' });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      { image: req.file.filename },
      { new: true },
    );

    logger.info('updateRestaurantProfilePhoto success', {
      restaurantId: req.restaurant._id,
    });

    return res.status(200).json({
      message: 'Restaurant photo updated',
      restaurant: updatedRestaurant,
    });
  } catch (err) {
    logger.error('updateRestaurantProfilePhoto failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

// Add menu items
module.exports.uploadMenuImage = upload.single('image');

module.exports.resizeMenuImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    req.file.filename = `menu-item-${req.restaurant._id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(800, 800)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/menuItems/${req.file.filename}`);

    next();
  } catch (err) {
    logger.error('resizeMenuImage failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.addMenuItem = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant._id;
    const { name, description, price, isAvailable } = req.body;

    if (!name || !price) {
      logger.warn('addMenuItem validation failed', {
        restaurantId,
        body: req.body,
      });
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      logger.warn('addMenuItem restaurant not found', { restaurantId });
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItem = await MenuItem.create({
      restaurant: restaurantId,
      name,
      description,
      price,
      image: req.file ? req.file.filename : 'default-food.jpeg',
      isAvailable: isAvailable ?? true,
    });

    logger.info('addMenuItem created', {
      restaurantId,
      menuItemId: menuItem._id,
    });

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem,
    });
  } catch (err) {
    logger.error('addMenuItem failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.getMenuItems = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant._id;
    const menuItems = await MenuItem.find({ restaurant: restaurantId });
    logger.info('getMenuItems fetched', {
      restaurantId,
      count: menuItems.length,
    });
    res.status(200).json({ data: menuItems });
  } catch (err) {
    logger.error('getMenuItems failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.deleteMenuItem = async (req, res, next) => {
  try {
    const menuItemId = req.params.id;
    const menuItem = await MenuItem.findByIdAndDelete(menuItemId);
    if (!menuItem) {
      logger.warn('deleteMenuItem not found', { menuItemId });
      return res.status(404).json({ message: 'Menu item not found' });
    }
    logger.info('deleteMenuItem success', { menuItemId });
    return res.status(200).json({ message: 'Menu item deleted successfully', menuItem });
  } catch (err) {
    logger.error('deleteMenuItem failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.logoutRestaurant = (req, res, next) => {
  try {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    logger.info('logoutRestaurant success', {
      restaurantId: req.restaurant?._id,
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('logoutRestaurant failed', {
      message: err.message,
      stack: err.stack,
    });
    next(err);
  }
};

module.exports.getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant._id;

    const orders = await Order.find({ restaurant: restaurantId })
      .populate('user', 'fullname email')
      .populate('restaurant', 'name')
      .populate('items.menuItem', 'name image')
      .sort({ createdAt: -1 });

    logger.info('getRestaurantOrders fetched', {
      restaurantId,
      count: orders.length,
    });

    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      orders,
      count: orders.length,
    });
  } catch (err) {
    logger.error('getRestaurantOrders failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.getRestaurantOrdersByStatus = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant._id;
    const { status } = req.params;

    const validStatuses = ['pending', 'preparing', 'out for delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      logger.warn('getRestaurantOrdersByStatus invalid status', {
        status,
        restaurantId,
      });
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const orders = await Order.find({ restaurant: restaurantId, status })
      .populate('user', 'fullname email')
      .populate('restaurant', 'name')
      .populate('items.menuItem', 'name image')
      .sort({ createdAt: -1 });

    logger.info('getRestaurantOrdersByStatus fetched', {
      restaurantId,
      status,
      count: orders.length,
    });

    return res.status(200).json({
      success: true,
      message: `Orders with status ${status} fetched successfully`,
      orders,
      count: orders.length,
    });
  } catch (err) {
    logger.error('getRestaurantOrdersByStatus failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.updateOrderStatus = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant._id;
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'out for delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      logger.warn('updateOrderStatus invalid status', { status, restaurantId });
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, preparing, out for delivery, delivered',
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurantId,
    });

    if (!order) {
      logger.warn('updateOrderStatus order not found or not belong to restaurant', {
        orderId,
        restaurantId,
      });
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to your restaurant',
      });
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate('user', 'fullname email')
      .populate('restaurant', 'name')
      .populate('items.menuItem', 'name image');

    logger.info('updateOrderStatus success', { orderId, status, restaurantId });

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (err) {
    logger.error('updateOrderStatus failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.getOrderCounts = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant._id;

    const counts = await Order.aggregate([
      { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = {};
    counts.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    const allStatuses = ['pending', 'preparing', 'out for delivery', 'delivered'];
    allStatuses.forEach((status) => {
      if (!statusCounts[status]) statusCounts[status] = 0;
    });

    logger.info('getOrderCounts fetched', {
      restaurantId,
      counts: statusCounts,
    });

    return res.status(200).json({
      success: true,
      message: 'Order counts fetched successfully',
      counts: statusCounts,
    });
  } catch (err) {
    logger.error('getOrderCounts failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};
