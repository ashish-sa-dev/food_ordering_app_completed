const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
    },
    description: String,
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    image: {
      type: String,
      default: 'default-food.jpeg',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);
menuItemSchema.index({
  name: 'text',
  description: 'text',
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
