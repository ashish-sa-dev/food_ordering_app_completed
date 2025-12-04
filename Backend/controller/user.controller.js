// controllers/user.controller.js
const logger = require('../config/logger');
const userModel = require('../models/user.model');
const Restaurant = require('../models/restaurant.model');
const multer = require('multer');
const sharp = require('sharp');
const { getCoordinates } = require('../utils/geocode');

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

module.exports.registerUser = async (req, res, next) => {
  try {
    const { fullname, email, password, street, city, state, pincode } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      logger.warn('registerUser already exists', { email });
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!password || password.length < 6) {
      logger.warn('registerUser weak password', { email });
      return res.status(400).json({ message: 'Minimum 6 characters required' });
    }

    const fullAddress = `${street},${city},${state},${pincode}`;
    const coordinates = await getCoordinates(fullAddress);

    if (!coordinates) {
      logger.warn('registerUser could not get coordinates', { fullAddress });
      return res.status(400).json({ message: 'Could not get coordinates' });
    }

    const hashedPassword = await userModel.hashPassword(password);

    const newUser = await userModel.create({
      fullname,
      email,
      password: hashedPassword,
      address: [
        {
          street,
          city,
          state,
          pincode,
          location: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      ],
    });

    const token = newUser.generateAuthToken();

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    logger.info('User registered', { userId: newUser._id, email });

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    logger.error('registerUser failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
      body: req.body,
    });
    next(err);
  }
};

module.exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('loginUser invalid credentials', { email });
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('loginUser invalid credentials', { email });
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = user.generateAuthToken();
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    logger.info('loginUser success', { userId: user._id, email });

    return res.status(200).json({ message: 'Login successful', user, token });
  } catch (err) {
    logger.error('loginUser failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.getUserProfile = async (req, res) => {
  try {
    logger.info('User profile retrieved', {
      userId: req.user._id,
      email: req.user.email,
    });
    return res.status(200).json({ message: 'User profile retrieved successfully', user: req.user });
  } catch (err) {
    logger.error('getUserProfile failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    throw err;
  }
};

module.exports.getAllusers = async (req, res, next) => {
  try {
    const queryObject = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((field) => delete queryObject[field]);

    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = userModel.find(JSON.parse(queryStr));

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const totalUsers = await userModel.countDocuments();
      if (skip >= totalUsers) {
        throw new Error('This page does not exist');
      }
    }

    const users = await query;
    logger.info('getAllusers success', { count: users.length, page });
    res.status(200).json({ message: 'Users retrieved successfully', users });
  } catch (err) {
    logger.error('getAllusers failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
      query: req.query,
    });
    next(err);
  }
};

// To update User Address
module.exports.updateAddress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { street, city, state, pincode } = req.body;

    const fullAddress = `${street},${city},${state},${pincode}`;

    const coordinates = await getCoordinates(fullAddress);

    if (!coordinates) {
      logger.warn('updateAddress could not get coordinates', {
        userId,
        fullAddress,
      });
      return res.status(400).json({ message: 'could not get coordinates' });
    }

    const user = await userModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          address: {
            street,
            city,
            state,
            pincode,
            location: {
              type: 'Point',
              coordinates: [coordinates.longitude, coordinates.latitude],
            },
          },
        },
      },
      { new: true },
    );

    logger.info('updateAddress success', { userId });
    res.status(200).json({
      message: 'Address updated successfully!',
      user,
    });
  } catch (err) {
    logger.error('updateAddress failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
      body: req.body,
    });
    next(err);
  }
};

module.exports.getNearByRestaurant = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.address || !user.address.length) {
      logger.warn('getNearByRestaurant user has no address', {
        userId: user._id,
      });
      return res.status(400).json({ message: 'User has no address saved' });
    }

    const [lng, lat] = user.address[0].location.coordinates;

    const distance = 10 / 6378.1; // ~10 km radius (adjust as needed)

    const restaurants = await Restaurant.find({
      'address.location': {
        $geoWithin: {
          $centerSphere: [[lng, lat], distance],
        },
      },
    });

    logger.info('getNearByRestaurant success', {
      userId: user._id,
      count: restaurants.length,
    });

    return res.status(200).json({
      status: 'success',
      results: restaurants.length,
      data: restaurants,
    });
  } catch (err) {
    logger.error('getNearByRestaurant failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.popularRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({
      'address.city': { $regex: /^ahmedabad$/i },
      active: true,
      isOpen: true,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    logger.info('popularRestaurants fetched', { count: restaurants.length });

    return res.status(200).json({
      status: 'success',
      count: restaurants.length,
      data: restaurants,
    });
  } catch (err) {
    logger.error('popularRestaurants failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};

module.exports.updateUser = upload.single('photo');

module.exports.resizeImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

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

module.exports.updateUserProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      logger.warn('updateUserProfilePhoto no file', { userId: req.user._id });
      return res.status(400).json({ message: 'please upload image' });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { photo: req.file.filename },
      { new: true },
    );

    logger.info('updateUserProfilePhoto success', { userId: req.user._id });

    return res.status(200).json({
      message: 'Profile photo updated',
      user: updatedUser,
    });
  } catch (err) {
    logger.error('updateUserProfilePhoto failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
    });
    next(err);
  }
};
