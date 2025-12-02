const userModel = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");
const multer = require("multer");
const sharp = require("sharp");
const { getCoordinates } = require("../utils/geocode");

// const multerStorage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'public/img/users');
//     },
//     filename:(req,file,cb)=>{
//         const ext = file.mimetype.split('/')[1];
//         cb(null,`user-${req.user._id}-${Date.now()}.${ext}`);
//     }
// });

module.exports.registerUser = async (req, res) => {
  try {
    const { fullname, email, password, street, city, state, pincode } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Minimum 6 characters required" });
    }

    const fullAddress = `${street},${city},${state},${pincode}`;
    const coordinates = await getCoordinates(fullAddress);

    if (!coordinates) {
      return res.status(400).json({ message: "Could not get coordinates" });
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
            type: "Point",
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        },
      ],
    });

    const token = newUser.generateAuthToken();

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "lax",
      path: "/",
    });

    return res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};


module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = user.generateAuthToken();
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // true only in production (HTTPS)
      sameSite: "lax", // or “none” if frontend is on different domain/port
      path: "/",
    });
    return res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error during login", error: error.message });
  }
};

module.exports.getUserProfile = async (req, res) => {
  console.log(req.file);
  console.log(req.body);
  console.log("authenticated user:", req.user);
  res
    .status(200)
    .json({ message: "User profile retrieved successfully", user: req.user });
};

module.exports.getAllusers = async (req, res) => {
  try {
    // for Filtering, Sorting and Pagination
    const queryObject = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((field) => delete queryObject[field]);

    // for advanced filtering
    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Query
    let query = userModel.find(JSON.parse(queryStr));

    // for field limiting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const totalUsers = await userModel.countDocuments();
      if (skip >= totalUsers) {
        throw new Error("This page does not exist");
      }
    }

    // Execute query
    const users = await query;
    res.status(200).json({ message: "Users retrieved successfully", users });
  } catch (error) {
    res.status(500).json({
      message: "Server error during user retrieval",
      error: error.message,
    });
  }
};

// To update User Address
module.exports.updateAddress = async (req, res) => {
  console.log(req.user);
  const userId = req.user._id;
  const { street, city, state, pincode } = req.body;

  const fullAddress = `${street},${city},${state},${pincode}`;

  const coordinates = await getCoordinates(fullAddress);
  console.log(coordinates);
  if (!coordinates) {
    return res.status(400).json({ message: "could not get coordinates" });
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
            type: "Point",
            coordinates: [coordinates.longitude, coordinates.latitude], // GeoJSON format
          },
        },
      },
    },
    { new: true }
  );

  res.status(200).json({
    message: "Address updated successfully!",
    user,
  });
};

module.exports.getNearByRestaurant = async (req, res) => {
  try {
    console.log("Near by user call");
    const user = req.user;

    if (!user.address.length) {
      return res.status(400).json({ message: "User has no address saved" });
    }

    const [lng, lat] = user.address[0].location.coordinates;
    console.log(lng, lat);

    const distance = 10 / 6378.1; // 2 km radius

    const restaurants = await Restaurant.find({
      "address.location": {
        $geoWithin: {
          $centerSphere: [[lng, lat], distance],
        },
      },
    });

    console.log(restaurants);
    return res.status(200).json({
      status: "success",
      results: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports.popularRestaurants = async (req, res) => {
  try {
    // Find restaurants in Ahmedabad
    const restaurants = await Restaurant.find({
      "address.city": { $regex: /^ahmedabad$/i }, // case-insensitive match
      active: true,
      isOpen: true,
    })
      .sort({ createdAt: -1 }) // sort by latest (until you add ratings)
      .limit(5);

    return res.status(200).json({
      status: "success",
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    console.error("Popular restaurants error:", error);
    return res.status(500).json({
      message: "Server error fetching popular restaurants",
      error: error.message,
    });
  }
};

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

// To upload and resize user profile photo
module.exports.updateUser = upload.single("photo");

module.exports.resizeImage = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

module.exports.updateUserProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "please upload image" });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { photo: req.file.filename },
      { new: true }
    );

    return res.status(200).json({
      message: "Profile photo updated",
      user: updatedUser,
    });
  } catch (err) {
    return res
      .status(400)
      .json9({ message: "error while adding profile picture" });
  }
};
