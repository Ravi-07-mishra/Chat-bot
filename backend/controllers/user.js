const User = require("../models/User")
const bcrypt = require('bcryptjs');
const { createToken } = require("../utils/token-manager");
const { COOKIE_NAME } = require("../utils/constants");
 const getAllusers = async(req,res)=>{
try {
    const users = await User.find({});
return res.status(201).json({
    message: "OK",users
})
    
} catch (error) {
    return res.status(200).json({
        message: "ERROR",cause: error.message
    })
}
}
 const userSignup = async(req,res)=>{
try {
  const {name,email,password} = req.body;
  const existinguser = await User.findOne({email});
  if(existinguser){
    return res.status(401).send("User already registered")
  }
  const salt = await bcrypt.genSalt(10);
 const hash = await bcrypt.hash(password,salt);
  const user = new User({name,email,password:hash});
  await user.save();
  // TOKEN WAS CREATED AND COOKIE WAS SAVED AFTER THIS
  res.clearCookie("bot_token",{path: "/", domain: "localhost",
    httpOnly: true,
    signed: true,
  });
  const token = createToken(user._id.toString(),user.email,"7d");
  const expires = new Date();
  expires.setDate(expires.getDate()+7);
  res.cookie(COOKIE_NAME,token,{path: "/", domain: "localhost",expires,
    httpOnly: true,
    signed: true,
  });
  return res.status(200).json({message: "ok", name: user.name, email: user.email});
    
} catch (error) {
    return res.status(200).json({
        message: "ERROR",cause: error.message
    })
}
}
 const userLogin = async(req,res)=>{
try {
  const {email,password} = req.body;
  const user = await User.findOne({email});
  if(!user){
    return res.status(401).send("User not registered");
  }

  const iscorrect = await bcrypt.compare(password,user.password)
  if(!iscorrect){
    return res.status(403).send("Incorrect Password")
  }
  res.clearCookie("bot_token",{path: "/", domain: "localhost",
    httpOnly: true,
    signed: true,
  });
  const token = createToken(user._id.toString(),user.email,"7d");
  const expires = new Date();
  expires.setDate(expires.getDate()+7);
  res.cookie(COOKIE_NAME,token,{path: "/", domain: "localhost",expires,
    httpOnly: true,
    signed: true,
  });
  return res.status(200).json({message: "Successful login", name: user.name, email: user.email});
  
    
} catch (error) {
    return res.status(200).json({
        message: "ERROR",cause: error.message
    })
}
}
 const verifyUser = async(req,res)=>{
try {
  
  const user = await User.findById( res.locals.jwtData.id);
  if(!user){
    return res.status(401).send("User not registered or token is wrong");
  }
if(user._id.toString()!== res.locals.jwtData.id){
  return res.status(401).send("Permissions didn't match");
}
console.log(user._id.toString(),res.locals.jwtData.id)
  
  return res.status(200).json({message: "Successful login", name: user.name, email: user.email});
  
    
} catch (error) {
    return res.status(200).json({
        message: "ERROR",cause: error.message
    })
}
}
const logoutuser = async (req, res) => {
  try {
    if (req.signedCookies[COOKIE_NAME]) {
      // Clear the cookie from the client
      res.clearCookie(COOKIE_NAME, {
        path: '/',
        domain: "localhost",  // Include the domain option here
        httpOnly: true,
        signed: true,
        sameSite: 'strict',
      });
      
    }

    // Send a success response
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
};


module.exports = {getAllusers,userSignup,userLogin,verifyUser,logoutuser}