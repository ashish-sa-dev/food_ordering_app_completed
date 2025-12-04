const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z\s]+$/.test(v); // only letters and spaces
        },
        message: 'Full name can only contain letters and spaces',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail, //  Using validator library
        message: 'Please provide a valid email address',
      },
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },

    address: [
      {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: {
          type: String,
          validate: {
            validator: function (v) {
              return /^[1-9][0-9]{5}$/.test(v); // ✅ Indian PIN validation
            },
            message: 'Please enter a valid 6-digit pincode',
          },
        },

        location: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
            validate: {
              validator: function (v) {
                // Ensure both lat and long are valid
                return (
                  Array.isArray(v) &&
                  v.length === 2 &&
                  v[0] >= -180 &&
                  v[0] <= 180 &&
                  v[1] >= -90 &&
                  v[1] <= 90
                );
              },
              message: 'Invalid coordinates format',
            },
            default: [0, 0],
          },
        },
      },
    ],
    photo: {
      type: String, // store only the filename, not binary data
      default: 'default.jpeg',
    },
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

userSchema.index({ 'address.location': '2dsphere' });

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
  return token;
};

userSchema.methods.passwordChangedAtAfterJson = function (Jwttimestamp) {
  if (this.passwordChangedAt) {
    const changedpasswordtimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    if (Jwttimestamp < changedpasswordtimestamp) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token before saving to DB (so it’s not readable if DB leaks)
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Token expires in 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken; // plain token (send via email)
};

module.exports = mongoose.model('User', userSchema);
