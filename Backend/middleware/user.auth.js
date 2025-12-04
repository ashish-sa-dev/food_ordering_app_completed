const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const logger = require('../config/logger');

// ----------------------------
// AUTHENTICATE USER
// ----------------------------
module.exports.authenticateUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    logger.warn('User access denied: No token provided');
    return res.status(401).json({
      status: 'fail',
      message: 'You are not logged in! Please log in to get access.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const freshUser = await User.findById(decoded._id);
    if (!freshUser) {
      logger.warn('User token valid but account removed');
      return res.status(401).json({ status: 'fail', message: 'User no longer exists.' });
    }

    if (freshUser.passwordChangedAtAfterJson(decoded.iat)) {
      logger.warn('User password changed after token was issued');
      return res.status(401).json({
        status: 'fail',
        message: 'Password recently changed. Please log in again.',
      });
    }

    req.user = freshUser;
    next();
  } catch (err) {
    logger.error('User token verification failed', { error: err.message });
    return next(err);
  }
};

// ----------------------------
// AUTHORIZE USER
// ----------------------------
module.exports.authorizeUser = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized user role: ${req.user.role}`);
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// ----------------------------
// FORGOT PASSWORD
// ----------------------------
module.exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`User forgotPassword: No account for ${email}`);
      return res.status(404).json({ message: 'No user found with this email' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/user/reset-password/${resetToken}`;
    const message = `Forgot password? PATCH new password to: ${resetURL}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token (valid 15 min)',
        message,
      });

      logger.info(`Reset token sent to user: ${email}`);

      return res.status(200).json({ message: 'Token sent to email!' });
    } catch (err) {
      logger.error('Failed to send user reset email', { error: err.message });

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(err);
    }
  } catch (error) {
    logger.error('User forgotPassword error', { error: error.message });
    return next(error);
  }
};

// ----------------------------
// RESET PASSWORD
// ----------------------------
module.exports.resetPassword = async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      logger.warn('User reset token invalid or expired');
      return res.status(400).json({ message: 'Token invalid or expired' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.generateAuthToken();
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    logger.info(`User password reset successful: ${user.email}`);

    return res.status(200).json({ message: 'Password reset successful', token });
  } catch (error) {
    logger.error('User resetPassword error', { error: error.message });
    return next(error);
  }
};

// ----------------------------
// UPDATE PASSWORD WHILE LOGGED IN
// ----------------------------
module.exports.updatePassword = async (req, res, next) => {
  try {
    const { passwordCurrent, passwordNew } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      logger.warn('updatePassword: User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(passwordCurrent);
    if (!isMatch) {
      logger.warn(`User entered wrong current password: ${user.email}`);
      return res.status(400).json({ message: 'Invalid password' });
    }

    user.password = passwordNew;
    await user.save();

    const token = user.generateAuthToken();
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });

    logger.info(`User password updated: ${user.email}`);

    return res.status(200).json({ message: 'Password updated successfully', token });
  } catch (error) {
    logger.error('User updatePassword error', { error: error.message });
    return next(error);
  }
};
