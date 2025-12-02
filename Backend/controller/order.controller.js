const Order = require("../models/order.model");
const MenuItem = require("../models/menuItem.model");

module.exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { restaurant, items, deliveryAddress, paymentMethod } = req.body;

    if (!restaurant || !items || items.length === 0) {
      return res.status(400).json({ message: "Restaurant and items are required" });
    }

    // Fetch menu items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menu = await MenuItem.findById(item.menuItem);

      if (!menu) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      const price = menu.price;
      totalAmount += price * item.quantity;

      orderItems.push({
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: price
      });
    }

    const newOrder = await Order.create({
      user: userId,
      restaurant,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod
    });

    return res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
    });

  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .populate("restaurant", "name image")
      .populate("items.menuItem", "name image price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Orders fetched successfully",
      orders
    });

  } catch (err) {
    console.error("ORDER HISTORY ERROR:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};
