const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const sendEmail = require('../utils/email');


module.exports.authenticateUser = async (req, res, next) => {
    let token;
 
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }else if(req.cookies.jwt){
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'You are not logged in! Please log in to get access.' });
  }

  try {
    // 2. Verify token (checks signature and expiry)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);

    // 3. Check if user still exists
    const freshUser = await User.findById(decoded._id);
    if (!freshUser) {
      return res.status(401).json({ status: 'fail', message: 'The user belonging to this token no longer exists.' });
    }

    // 4. To check if user Changed password after the token was issued 
    if(freshUser.passwordChangedAtAfterJson(decoded.iat)){
      return res.status(401).json({status:'fail',message:'Something went Wrong! please Login again'});
    }

    req.user = freshUser; 
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: 'Invalid or expired token.', error: err.message });
  }
};

module.exports.authorizeUser = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

module.exports.forgotPassword = async (req,res,next)=>{
  const {email} = req.body;

  try{
    const user = await User.findOne({email});
    if(!user){
      return res.status(404).json({message:'No user found with this email'});
    }
    
    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({validateBeforeSave:false});

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/user/reset-password/${resetToken}`;

   
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try{
      await sendEmail({
      email:user.email,
      subject:'Your password reset token (Valid for 15 min)',
      message : message
    })

    return res.status(200).json({message:'Token sent to email!'});
    }
    catch(err){
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({validateBeforeSave:false});

      return res.status(500).json({message:'There was an error sending the email. Try again later!'});
    }
  }

  catch(error){
    res.status(500).json({message:'something went wrong',error:error.message});
  }
};

module.exports.resetPassword = async (req,res,next)=>{
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  try{
    const user = await User.findOne({
      resetPasswordToken:hashedToken,
      resetPasswordExpire:{$gt:Date.now()}
    })

    if(!user){
      return res.status(400).json({message:'Token is invalid or has expired'});
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.generateAuthToken();
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

// THIS IS FOR UPDATE CURRENT PASSWORD WHILE LOGGED IN 
module.exports.updatePassword = async (req,res,next)=>{
  try{         
    const {passwordCurrent,passwordNew} = req.body; 
            
    const user = await User.findOne({_id:req.user._id }.select('+password')); 
    if(!user){
      return res.status(404).json({message:'user not found'});
    }
    const isMatch = await user.comparePassword(passwordCurrent);
    if(!isMatch){
      return res.status(400).json({message:'invalid password ! try again'});
    }
    user.password = passwordNew;
    await user.save();

    const token = user.generateAuthToken();
        res.cookie("jwt", token, {
      httpOnly: true,
      secure: false, // true only in production (HTTPS)
      sameSite: "lax", // or “none” if frontend is on different domain/port
      path: "/",
    });

   return res.status(200).json({message:'password updated successfully',token});


  }
  catch(error){
   return res.status(500).json({message:'something went wrong',error:error.message});
  }
}