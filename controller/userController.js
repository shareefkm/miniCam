const User = require('../models/user_model');
const bcrypt = require('bcrypt')
const nodeMailer = require('nodemailer');
const Category = require('../models/category')
const Product = require('../models/product_model');
const Cart = require('../models/cart')
const Orders = require('../models/order')
const Banner = require('../models/banner')
require('dotenv').config()
const client = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
const auth = require('../middleware/auth');

let message;
let isUser;
let chIndex;
let index;

//user home
const getHome = async(req,res)=>{
    try {
        let banners = await Banner.find({}).sort({_id:-1})
        const categoryData = await Category.find({is_deleted:0})
        const productsData = await Product.find({is_deleted:0}).limit(6)
        isUser = req.session.user_id
        if(isUser){
            const profData = await User.findOne({_id:isUser})
            res.render('home',{isUser:profData,products:productsData,category:categoryData,message,banners})  
            message = null      
        }else{
            res.render('home',{isUser,products:productsData,category:categoryData,message,banners})        
        }
    } catch (error) {
        console.log(error.message);
    }
}

const convrtPassword = async(password)=>{
    try {
        const hashPassword = await bcrypt.hash(password,10)
        return hashPassword;
    } catch (error) {
        console.log(error.message);
    } 
}

const getProducts = async(req,res)=>{
    try {
        const category = await Category.find({is_deleted:0})
        const userData = await User.findOne({_id:req.session.user_id})
        const productsData = await Product.find({is_deleted:0})
       if(userData){
           res.render('users/products',{isUser:userData,products:productsData,category})
        }else{
           res.render('users/products',{isUser,products:productsData,category})
       }
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}

const getProductDeatails = async(req,res)=>{
    try {
        const proId = req.query.id
        const categories = await Category.find({is_deleted:0})
        const proDetail = await Product.findOne({_id:proId})
        res.render('users/productDetails',{isUser,proDetail,category:categories})
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}


////user gignup
const lordRegister = async(req,res)=>{
    try {
        res.render('users/userSignup',{message,isUser})  
        message=null;
    } catch (error) {
        console.log(error.message);
    }
}
const insertUser = async(req,res)=>{
    try {
        const checkUserEmail = await User.findOne({email:req.body.email});
        const checkUserPhone = await User.findOne({mobile:req.body.mobile});
        if(checkUserEmail === null){
            if(checkUserPhone === null){
                const newPassword = await convrtPassword(req.body.password)
                const user = new User({
                    name:req.body.name,
                    email:req.body.email,
                    mobile:req.body.mobile,
                    password:newPassword,
                    is_admin:0
                });
                const userData = await user.save();
                if(userData){
                    sendVerifyMail(req.body.name,req.body.email,userData._id)
                    res.redirect('/signup')
                    message = "register success: please verify your email ";
                }else{
                    res.redirect('/signup') 
                    message = "registration failed"
                }
            }else{
                res.redirect('/signup')
                message = "Phone Number Allredy Exists"
            } 
        }else{
            res.redirect('/signup')
            message = "Email Allredy Exists"
        }
    } catch (error) {
        console.log(error.message); 
    }
}

const verifyMail = async(req,res)=>{
    try {
        const updateVerifyStatus = await User.updateOne({_id:req.query.id},{$set:{is_verified:1}});
        res.redirect('/login')
        message = "Successfully verified email";
    } catch (error) {
        console.log(error.message);
    }
}
//send verifymail
const sendVerifyMail = async(name,email,user_id)=>{
    try {
        console.log(process.env.USER_MAIL,process.env.PASS,process.env.SESIONSECRET + 'llllllllll');
        const transporter = nodeMailer.createTransport({
            host:'smtp.gmail.com',
            port:465,
            secure:true,
            auth:{
                user:process.env.USER_MAIL,
                pass:process.env.PASS
            }
        }); 
        const mailOptions = {
            from:'babusabu026@gmail.com',
            to:email,
            subject:'For verification',
            html:'<p>Hello '+name+', Please click her to <a href="http://minicam.website/verify?id='+user_id+'">verify</a> your email.</p>'
        }
        transporter.sendMail(mailOptions,(err,info)=>{
            if(err){
                console.log(err,'=================================');
            }else{
                console.log("verify success:"+info.response);
            }
        })
    } catch (error) {
         console.log(error.message);
    }
}

//user login
const loadLogin = async(req,res)=>{
    try {
        res.render('users/userLogin',{message,isUser})
        message = null
    } catch (error) {
        console.log(error.message);
    }
}
const verifyLogin = async(req,res)=>{
    const userData = await User.findOne({email:req.body.email})
    if(userData){
        const checkPassword = await bcrypt.compare(req.body.password,userData.password)
        if(checkPassword){
            if(userData.is_blocked === 0){
                if(userData.is_verified === 0){
                    res.redirect('/login')
                    message = "Please Verify Your Email";
                }else{
                    req.session.user_id = userData._id,
                    isUser = req.session.user_id
                    res.redirect('/')
                }
            }else{
                res.redirect('/login')
                    message = "Your account is blocked";
            }
        }else{
            res.redirect('/login')
            message = "Incorrect Password"
        }
    }else{
        res.redirect('/login')
        message = "Email Note Found"
    }
}
const userLogout = async(req,res)=>{
    try {
        req.session.user_id = null
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}
const getPhoneOtp = async(req,res)=>{
    try {
        res.render('users/loginMob',{isUser,message}) 
        message = null       
    } catch (error) {
        console.log(error.message)
    }
}
// Handle POST request for login form
const postRequest = async(req, res) => {
    try {
            const phone = req.body.mobile;
            console.log(phone);
            req.session.phone = phone;
            console.log( req.session.phone);
            const user = await User.findOne({mobile:phone});
            console.log(user);
            if(user){
                if(user.is_blocked == 0){
                    const verification = await client.verify
                    .services(process.env.TWILIO_SERVICE_SID)
                    .verifications.create({ to: `+91${phone}`, channel: "sms" });
                    res.redirect('/mobileotp');
                }else{
                    res.redirect('/mobileverify')
                    message = "Your account is blocked"
                }
            }
      
    } catch (erro) {
        console.log(erro);
    }
}
const resendOTP = async (req, res) => {
    const { phone } = req.session;
    try {
      const verification = await client.verify
        .services(process.env.TWILIO_SERVICE_SID)
        .verifications.create({ to: `+91${phone}`, channel: "sms" });
      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  };


let verifyOtp = async(req,res) => {
const phone = req.session.phone
    const otp = req.body.otp
    console.log(phone);
    console.log(otp);
    try {
        const verification_check = await client.verify
          .v2.services(process.env.TWILIO_SERVICE_SID)
          .verificationChecks.create({ to: `+91${phone}`, code: otp });
      
        if (verification_check.status === "approved") {
          req.session.otpcorrect = true;
          const user = await User.findOne({mobile:phone});
          req.session.user_id = user._id,
          console.log("verificATION DONE");
          res.redirect('/');
        } else {
          res.redirect('/mobileotp', { msg: "OTP incorrect" });
        }
      } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ message: err.message });
      }
  
}
    
  const getOtp = async(req,res)=>{
    try {
        res.render('users/otp',{isUser}) 
    } catch (error) {
        console.log(error.message);
    }
  }
  ///user profile controll
  const getProfile = async(req,res)=>{
    try {
        const isUser = await User.findOne({_id:req.session.user_id})
        const category = await Category.find({is_deleted:0})
        res.render('users/profile',{isUser,message,category})
        message = null
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "server error"})
    }
  }

  const getProfileEdit = async(req,res)=>{
    try {
        const category = await Category.find({is_deleted:0})
        isUser = req.session.user_id
        const user = await User.findById({_id:isUser})
        console.log(user);
        res.render('users/editProfile',{isUser,user,message,category})
    } catch (error) {
        res.status(500).send('server error')
    }
  }

  const editProfile = async(req,res)=>{
    try {
        await User.updateOne({_id:req.session.user_id},
            {$set:{
                name:req.body.name,
                email:req.body.email,
                mobile:req.body.mobile,
            }})
            res.redirect('/profile')
    } catch (error) {
        res.status(500).sed('server error')
    }
  }
/////address////


const getAddAddress = async(req,res)=>{
    try {
        const category = await Category.find({is_deleted:0})
        const isUser = await User.findOne({_id:req.session.user_id})
        res.render('users/addAddress',{isUser,message,category})
        message = null
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}

const addAddress = async (req, res) => {
    try {
      const id = req.session.user_id;
      const user = await User.find({ _id: id });
      const data = req.body;
      if (
        (data.firstname,
        data.lastname,
        data.email,
        data.address,
        data.city,
        data.state,
        data.mobile,
        data.zip)
      ) {
        const userData = await User.findOne({ _id: new Object(id) });
        userData.address.push(data);
        await userData.save();
        res.redirect("/checkout");
        message = "Address added";
      } else {
        res.redirect("/addAddress");
        message = "Please fill all the forms";
      }
    } catch (error) { 
      console.log(error);
      res.status(500).send('server error')
    }
  }
  const getEditAddress = async(req,res)=>{
    try {
        chIndex =  req.query.index
        req.session.index =  chIndex
        const category = await Category.find({is_deleted:0})
        const isUser = await User.findOne({_id:req.session.user_id})
        res.render('users/editAddress',{isUser,message,chIndex,category})
        message = null
    } catch (error) {
        console.log(error);
        res.status(500).send({message: "server error"})
    }
  }
  
  const editAddress = async(req,res)=>{
    try { 
       const id = req.session.user_id
       const data = req.body
       const index =  req.query.index
       const key = `address.${index}`
       console.log(index);
       const user = await User.findOne({_id:id})
       const userd = await User.findOneAndUpdate({_id:id},{
        $set:{[key]:{
        firstname:data.firstname,
        lastname:data.lastname,
        email:data.email,
        address:data.address,
        city:data.city,
        state:data.state,
        mobile:data.mobile,
        zip:data.zip
        }
        }
       })
       res.redirect('/profile')
       message = 'Address edited success'
    } catch (error) {
        console.log(error);
        res.status(500).send({message:"server Error"})
    }
  }

  const deleteAddress = async (req, res) => {
    try {
      const isUser = req.session.user_id;
      const index = req.query.index;
      await User.updateOne(
        { _id: isUser },
        { $unset: { [`address.${index}`]: "" } }
      );
      await User.updateOne({ _id: isUser }, { $pull: { address: null } });
      res.redirect("/profile");
      message = "Address deleted"
    } catch (error) {
      console.log(error);
      res.status(500).send('server error')
    }
  };
  const getCategoryData = async(req,res)=>{
      try {
        const catId = req.query.id
        const userData = await User.findOne({_id:req.session.user_id})
        const category = await Category.find({is_deleted:0})
       if(userData){
           const catProduct = await Category.findOne({_id:catId}).populate('products')
           res.render('users/proCategory',{isUser:userData,catProduct:catProduct,category:category})
       }else{
           const catProduct = await Category.findOne({_id:catId}).populate('products')
           res.render('users/proCategory',{isUser,catProduct:catProduct,category:category})
       }
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
  }
    
 

const filterProducts = async(req,res)=>{
  try {
  const filterCategory = req.body.categorys
  console.log(filterCategory.length);
  const filterPrice = req.body.filterprice
  let category = []
  for(let i=0;i<filterCategory.length ; i++){
    let ncategory  = await Category.findOne({categoryname:filterCategory[i]}).populate('products')
    category.push(ncategory)
    console.log(category)
  }
  
    res.json({Data:category})
  } catch (error) {
    console.log(error);
    res.status(500).send('server error')
  }
}

module.exports = {
    lordRegister,
    insertUser,
    verifyMail,
    loadLogin,
    verifyLogin, 
    getHome,
    userLogout,
    getPhoneOtp,
    getOtp,
    postRequest,
    verifyOtp,
    getProducts,
    resendOTP,
    getAddAddress,
    addAddress,
    getEditAddress,
    editAddress,
    deleteAddress,
    getProfile,
    getProfileEdit,
    editProfile,
    getCategoryData,
    getProductDeatails,
    filterProducts
}