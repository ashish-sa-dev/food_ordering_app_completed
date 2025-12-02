const Restaurant = require("../models/restaurant.model");
const MenuItem = require("../models/menuItem.model");
const Order = require("../models/order.model");
const { getCoordinates } = require("../utils/geocode");
const multer = require("multer");
const mongoose = require("mongoose");
 
const sharp = require("sharp");
const { castObject } = require("../models/user.model");


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

module.exports.uploadRestaurantImage = upload.single("photo");

module.exports.resizeUploadedImage = async (req, res, next) => {
  if (!req.file) return next();
  
  req.file.filename = `restaurant-${req.body.email}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/restaurant/${req.file.filename}`);

  next();
};
module.exports.registerRestaurant = async (req, res) => {
  try {
    const { name, email, password, description, cuisineType, address } = req.body;

    console.log('Received address:', address); // Debug log
    console.log('Type of address:', typeof address); // Debug log

    // Parse address if it's a string (from JSON.stringify)
    let addressObj;
    if (typeof address === 'string') {
      try {
        addressObj = JSON.parse(address);
      } catch (parseError) {
        console.error('Error parsing address JSON:', parseError);
        return res.status(400).json({ message: "Invalid address format" });
      }
    } else {
      addressObj = address; // If it's already an object
    }

    console.log('Parsed address object:', addressObj); // Debug log

    const existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant) {
      return res.status(400).json({ message: "Restaurant already exists" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Minimum 6 characters required for password" });
    }
    
    const hashedPassword = await Restaurant.hashPassword(password);

    // Use the parsed address object
    const fullAddress = `${addressObj.street}, ${addressObj.city}, ${addressObj.state}, ${addressObj.pincode}`;
    console.log('Full address for geocoding:', fullAddress);

    const coordinates = await getCoordinates(fullAddress);

    if (!coordinates) {
      return res.status(400).json({ message: "Could not get coordinates" });
    }

    const restaurantAddress = {
      street: addressObj.street,
      city: addressObj.city,
      state: addressObj.state,
      pincode: addressObj.pincode,
      location: {
        type: "Point",
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
      image: req.file ? req.file.filename : "default-restaurant.jpeg"
    });

    const token = newRestaurant.generateAuthToken();

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return res.status(201).json({
      message: "Restaurant registered successfully",
      restaurant: newRestaurant,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: "Server error during restaurant registration",
      error: error.message,
    });
  }
};

module.exports.loginRestaurant = async (req, res) => {
  try {
    const { email, password } = req.body;

    const restaurant = await Restaurant.findOne({ email }).select("+password");
    if (!restaurant) {
      return res.status(400).json({ message: "invalid email or password" });
    }

    const isMatch = await restaurant.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "invalid email or password" });
    }

    const token = restaurant.generateAuthToken();
     res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // true only in production (HTTPS)
      sameSite: "lax", // or “none” if frontend is on different domain/port
      path: "/",
    });

    return res
      .status(200)
      .json({ message: "Login success", restaurant, token });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "error while login ! please try again" });
  }
};
module.exports.profile = async (req, res) => {
  res
    .status(200)
    .json({ message: "From protected route", restaurant: req.restaurant });
};

module.exports.search = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ message: "query is required to search" });
    }

    const restaurantsByName = await Restaurant.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    const menuItems = await MenuItem.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .populate("restaurant");

    const restaurantsFromMenu = [
      ...new Map(
        menuItems.map((item) => [item.restaurant._id, item.restaurant])
      ).values(),
    ];

    console.log(restaurantsFromMenu);

    const allRestaurants = [
      ...new Map(
        [...restaurantsByName, ...restaurantsFromMenu].map((r) => [
          r._id.toString(),
          r,
        ])
      ).values(),
    ];

    console.log(allRestaurants);

    return res.status(200).json({
      total: allRestaurants.length,
      restaurants: allRestaurants,
    });
  } catch (err) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.getRestaurantDetails = async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const restaurant = await Restaurant.findById(restaurantId)
      .populate("menuItems"); // populate virtual field

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    return res.status(200).json({
      message: "Restaurant details fetched",
      restaurant
    });

  } catch (err) {
    console.error("Error fetching restaurant details:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


// To upload and resize user profile photo
module.exports.updateRestaurant = upload.single("photo");

module.exports.resizeImage = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `restaurant-${req.restaurant._id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/restaurant/${req.file.filename}`);

  next();
};

module.exports.updateRestaurantProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "please upload image" });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      { image: req.file.filename },
      { new: true }
    );

    return res.status(200).json({
      message: "Restaurant photo updated",
      restaurant: updatedRestaurant,
    });
  } catch (err) {
    return res
      .status(400)
      .json9({ message: "error while adding restaurant picture" });
  }
};



//Add menu items 

module.exports.uploadMenuImage = upload.single("image");

module.exports.resizeMenuImage = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `menu-item-${req.restaurant._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(800, 800)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/menuItems/${req.file.filename}`);

  next();
};

module.exports.addMenuItem = async (req, res) => {
  try {
    console.log("add menu call");
    const restaurantId = req.restaurant._id;

    const { name, description, price, isAvailable } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menuItem = await MenuItem.create({
      restaurant: restaurantId,
      name,
      description,
      price,
      image: req.file ? req.file.filename : "default-food.jpeg",
      isAvailable: isAvailable ?? true,
    });

    res.status(201).json({
      message: "Menu item created successfully",
      menuItem,
    });
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


module.exports.getMenuItems = async (req, res) => {
  try {
    console.log("get menu call");
    const restaurantId = req.restaurant._id;
    const menuItems = await MenuItem.find({ restaurant: restaurantId });
    res.status(200).json({ data: menuItems });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItemId = req.params.id;
    const menuItem = await MenuItem.findByIdAndDelete(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    return res.status(200).json({ message: "Menu item deleted successfully", menuItem });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports.logoutRestaurant = (req, res) => {
  try {
    // Clear the JWT cookie

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
    
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Logout failed', error: error.message });
  }
}; 



module.exports.getRestaurantOrders = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    
    const orders = await Order.find({ restaurant: restaurantId })
      .populate('user', 'fullname email')
      .populate('restaurant', 'name')
      .populate('items.menuItem', 'name image')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      orders,
      count: orders.length
    });
  } catch (err) {
    console.error('Error fetching restaurant orders:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports.getRestaurantOrdersByStatus = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { status } = req.params;

    if (!['pending', 'preparing', 'out for delivery', 'delivered'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const orders = await Order.find({ 
      restaurant: restaurantId, 
      status: status 
    })
      .populate('user', 'fullname email')
      .populate('restaurant', 'name')
      .populate('items.menuItem', 'name image')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: `Orders with status ${status} fetched successfully`,
      orders,
      count: orders.length
    });
  } catch (err) {
    console.error('Error fetching orders by status:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports.updateOrderStatus = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'preparing', 'out for delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, preparing, out for delivery, delivered'
      });
    }

    // Check if order exists and belongs to this restaurant
    const order = await Order.findOne({ 
      _id: orderId, 
      restaurant: restaurantId 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to your restaurant'
      });
    }

    // Update the order status
    order.status = status;
    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(orderId)
      .populate('user', 'fullname email')
      .populate('restaurant', 'name')
      .populate('items.menuItem', 'name image');

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports.getOrderCounts = async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;

    const counts = await Order.aggregate([
      { 
        $match: { 
          restaurant: new mongoose.Types.ObjectId(restaurantId) 
        } 
      },
      { 
        $group: { 
          _id: '$status',
          count: { $sum: 1 }
        } 
      }
    ]);

    // Convert array to object
    const statusCounts = {};
    counts.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    // Ensure all statuses are present
    const allStatuses = ['pending', 'preparing', 'out for delivery', 'delivered'];
    allStatuses.forEach(status => {
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Order counts fetched successfully',
      counts: statusCounts
    });
  } catch (err) {
    console.error('Error getting order counts:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};