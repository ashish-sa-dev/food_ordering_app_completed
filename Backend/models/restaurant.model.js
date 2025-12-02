const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require("crypto");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },

    description: {
      type: String,
      trim: true,
    },

    address: {  
      street: String,
      city: String,
      state: String,
      pincode: String,
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          default: [0, 0],// [lng, lat]
        },
      },
    },

    cuisineType: {
      type: [String],
      default: ['General'],
    },

    image: {
      type: String,
      default: 'default-restaurant.jpeg',
    },

    isOpen: {
      type: Boolean,
      default: true,
    },
     passwordChangedAt:Date,
     resetPasswordToken: String,
    resetPasswordExpire: Date,
    active:{
      type:Boolean,
      default:true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },   // <-- ADD THIS
    toObject: { virtuals: true }  // <-- ADD THIS
  }
);  

// Create a 2dsphere index on the location field for geospatial queries
restaurantSchema.index({ 'address.location': '2dsphere' });

restaurantSchema.index({ 
  name: 'text',
  cuisineType: 'text',
  description: 'text'
});

restaurantSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

restaurantSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

restaurantSchema.methods.generateAuthToken =  function(){
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
    return token;
};

restaurantSchema.methods.passwordChangedAtAfterJson= function(Jwttimestamp){
   if(this.passwordChangedAt){
    const changedpasswordtimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    if(Jwttimestamp < changedpasswordtimestamp){
      return true;
    }
    else{
      return false;
    }
  }
  return false;
}

restaurantSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token before saving to DB (so it’s not readable if DB leaks)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken; // plain token (send via email)
};

restaurantSchema.virtual('menuItems', {
  ref: 'MenuItem',             // Model to link
  localField: '_id',           // Field in Restaurant
  foreignField: 'restaurant',  // Field in MenuItem
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
