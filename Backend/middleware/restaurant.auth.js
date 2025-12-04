const jwt = require('jsonwebtoken');
const Restaurant = require('../models/restaurant.model');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const logger = require('../config/logger');

// ----------------------------
// AUTHENTICATE RESTAURANT
// ----------------------------
module.exports.authenticateRestaurant = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    logger.warn('Restaurant access denied: No token provided');
    return res.status(401).json({
      status: 'fail',
      message: 'You are not logged in! Please log in to get access.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const freshRestaurant = await Restaurant.findById(decoded._id);
    if (!freshRestaurant) {
      logger.warn('Restaurant token valid but user no longer exists');
      return res.status(401).json({
        status: 'fail',
        message: 'The restaurant no longer exists.',
      });
    }

    if (freshRestaurant.passwordChangedAtAfterJson(decoded.iat)) {
      logger.warn('Restaurant password was changed after token was issued');
      return res.status(401).json({
        status: 'fail',
        message: 'Password changed recently. Please login again.',
      });
    }

    req.restaurant = freshRestaurant;
    next();
  } catch (err) {
    logger.error('Restaurant token verification failed', {
      error: err.message,
    });
    return next(err);
  }
};

// ----------------------------
// FORGOT PASSWORD
// ----------------------------
module.exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const restaurant = await Restaurant.findOne({ email });

    if (!restaurant) {
      logger.warn(`Restaurant forgotPassword: No account found for ${email}`);
      return res.status(404).json({ message: 'No restaurant found with this email' });
    }

    const resetToken = restaurant.generatePasswordResetToken();
    await restaurant.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/restaurant/reset-password/${resetToken}`;
    const message = `Forgot password? Send a PATCH request to: ${resetURL}`;

    try {
      await sendEmail({
        email: restaurant.email,
        subject: 'Password reset token (valid 15 min)',
        message,
      });

      logger.info(`Reset token sent successfully to restaurant: ${email}`);

      return res.status(200).json({ message: 'Token sent to email!' });
    } catch (err) {
      logger.error('Failed to send restaurant reset email', {
        error: err.message,
      });

      restaurant.resetPasswordToken = undefined;
      restaurant.resetPasswordExpire = undefined;
      await restaurant.save({ validateBeforeSave: false });

      return next(err);
    }
  } catch (error) {
    logger.error('Restaurant forgotPassword error', { error: error.message });
    return next(error);
  }
};

// ----------------------------
// RESET PASSWORD
// ----------------------------
module.exports.resetPassword = async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  try {
    const restaurant = await Restaurant.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!restaurant) {
      logger.warn('Restaurant reset token invalid or expired');
      return res.status(400).json({ message: 'Token invalid or expired' });
    }

    const hashPassword = await Restaurant.hashPassword(req.body.password);
    restaurant.password = hashPassword;
    restaurant.resetPasswordToken = undefined;
    restaurant.resetPasswordExpire = undefined;
    await restaurant.save();

    const token = restaurant.generateAuthToken();
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    logger.info(`Restaurant password reset successful: ${restaurant.email}`);

    return res.status(200).json({ message: 'Password reset successful', token });
  } catch (error) {
    logger.error('Restaurant resetPassword error', { error: error.message });
    return next(error);
  }
};
