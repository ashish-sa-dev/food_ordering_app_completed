const jwt = require("jsonwebtoken");
const Restaurant = require("../models/restaurant.model");
const sendEmail = require('../utils/email');
const crypto = require("crypto");


module.exports.authenticateRestaurant = async (req,res,next)=>{
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }else if(req.cookies.jwt){
    token = req.cookies.jwt;
  }

   if (!token) {
    return res.status(401).json({ status: 'fail', message: 'You are not logged in! Please log in to get access.' });
  }

  try{
     const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const freshRestaurant = await Restaurant.findById(decoded._id);
     if (!freshRestaurant) {
      return res.status(401).json({ status: 'fail', message: 'The Restaurant no longer exists.' });
    }

    if(freshRestaurant.passwordChangedAtAfterJson(decoded.iat)){
      return res.status(401).json({status:'fail',message:'Something went Wrong! please Login again'});
    }

    req.restaurant = freshRestaurant;
    next();

  }catch(err){
    return res.status(401).json({ message: 'Invalid or expired token.', error: err.message });
  }

};

module.exports.forgotPassword = async (req,res,next)=>{
  const {email} = req.body;

  try{
    const restaurant = await Restaurant.findOne({email});
    if(!restaurant){
      return res.status(404).json({message:'No Restaurant found with this email'});
    }
    
    // Generate reset token
    const resetToken = restaurant.generatePasswordResetToken();
    await restaurant.save({validateBeforeSave:false});
  

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/restaurant/reset-password/${resetToken}`;

   
    const message = `Forgot your password? Submit a PATCH request with your new password  to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try{
      await sendEmail({
      email:restaurant.email,
      subject:'Your password reset token (Valid for 15 min)',
      message : message
    })

    return res.status(200).json({message:'Token sent to email!'});
    }
    catch(err){
      restaurant.resetPasswordToken = undefined;
      restaurant.resetPasswordExpire = undefined;
      await restaurant.save({validateBeforeSave:false});

      return res.status(500).json({message:'There was an error sending the email. Try again later!'});
    }
  }

  catch(error){
   return res.status(500).json({message:'something went wrong',error:error.message});
  }
};

module.exports.resetPassword = async (req,res,next)=>{
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  try{
    const restaurant = await Restaurant.findOne({
      resetPasswordToken:hashedToken,
      resetPasswordExpire:{$gt:Date.now()}
    })

    if(!restaurant){
      return res.status(400).json({message:'Token is invalid or has expired'});
    }

    const hashPassword = await Restaurant.hashPassword(req.body.password);
    restaurant.password = hashPassword;
    restaurant.resetPasswordToken = undefined;
    restaurant.resetPasswordExpire = undefined;
    await restaurant.save();

    const token = restaurant.generateAuthToken();
     res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // true only in production (HTTPS)
      sameSite: "lax", // or “none” if frontend is on different domain/port
      path: "/",
    });

    return res.status(200).json({message:'Password reset successful', token});
  }catch(error){
   return res.status(500).json({message:'something went wrong',error:error.message});
  }
};