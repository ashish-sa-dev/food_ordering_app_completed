// controllers/order.controller.js
const logger = require('../config/logger');
const Order = require('../models/order.model');
const MenuItem = require('../models/menuItem.model');

module.exports.placeOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { restaurant, items, deliveryAddress, paymentMethod } = req.body;

    logger.info('placeOrder initiated', {
      userId,
      restaurantId: restaurant,
      itemCount: items?.length,
      paymentMethod,
    });

    if (!restaurant || !items || items.length === 0) {
      logger.warn('placeOrder validation failed: missing restaurant or items', {
        userId,
        restaurant,
        itemsCount: items?.length,
      });
      return res.status(400).json({ message: 'Restaurant and items are required' });
    }

    // Fetch menu items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menu = await MenuItem.findById(item.menuItem);

      if (!menu) {
        logger.warn('placeOrder: menu item not found', {
          userId,
          menuItemId: item.menuItem,
        });
        return res.status(404).json({ message: 'Menu item not found' });
      }

      const price = menu.price || 0;
      totalAmount += price * (item.quantity || 1);

      orderItems.push({
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: price,
      });
    }

    const newOrder = await Order.create({
      user: userId,
      restaurant,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
    });

    logger.info('Order placed successfully', {
      userId,
      orderId: newOrder._id,
      restaurantId: restaurant,
      totalAmount,
      itemCount: orderItems.length,
      paymentMethod,
    });

    return res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder,
    });
  } catch (err) {
    logger.error('placeOrder failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
      userId: req.user ? req.user._id : undefined,
      body: req.body,
    });
    next(err);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;

    logger.info('getUserOrders initiated', { userId });

    const orders = await Order.find({ user: userId })
      .populate('restaurant', 'name image')
      .populate('items.menuItem', 'name image price')
      .sort({ createdAt: -1 });

    logger.info('User orders fetched successfully', {
      userId,
      orderCount: orders.length,
    });

    return res.status(200).json({
      message: 'Orders fetched successfully',
      orders,
      count: orders.length,
    });
  } catch (err) {
    logger.error('getUserOrders failed', {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl,
      userId: req.user ? req.user._id : undefined,
    });
    next(err);
  }
};
