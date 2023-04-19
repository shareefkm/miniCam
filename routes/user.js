//import
const express = require('express');
const userRouter = express.Router();
const bodyParser = require('body-parser')
const multer = require('multer')

const auth = require('../middleware/auth')

userRouter.use(bodyParser.json());
userRouter.use(bodyParser.urlencoded({extended:true}));
 
const userController = require('../controller/userController'); 
const cartController = require('../controller/cartController');
const orderController = require('../controller/orderController')



userRouter.get('/',userController.getHome)
userRouter.get('/signup',auth.isUserLogout,userController.lordRegister)
userRouter.post('/signup',auth.isUserLogout,userController.insertUser)
userRouter.get('/verify',userController.verifyMail)
userRouter.get('/login',auth.isUserLogout,userController.loadLogin)
userRouter.post('/login',auth.isUserLogout,userController.verifyLogin)
userRouter.get('/logout',auth.isUserLogin,userController.userLogout)
userRouter.get('/mobileverify',auth.isUserLogout,userController.getPhoneOtp)
userRouter.post('/mobileverify',auth.isUserLogout,userController.postRequest)
userRouter.get('/mobileotp',auth.isUserLogout,userController. getOtp)
userRouter.post('/mobileotp',auth.isUserLogout,userController.verifyOtp) 
userRouter.get('/product',userController.getProducts)
userRouter.get('/cart',auth.isUserLogin,cartController.getCart)
userRouter.get('/addcart/:id',auth.isUserLogin,cartController.addToCart)
userRouter.post('/resendOTP',auth.isUserLogout,userController.resendOTP)
userRouter.post('/increment',auth.isUserLogin,cartController.increment,)
userRouter.post('/decrement',auth.isUserLogin,cartController.decrement)
userRouter.post('/removeCartItem',auth.isUserLogin,cartController.removeCartItem)
userRouter.get('/checkout',auth.isUserLogin,orderController.getCheckout)
userRouter.post('/checkout',auth.isUserLogin,orderController.addCheckout)
userRouter.get('/addAddress',auth.isUserLogin,userController.getAddAddress)
userRouter.post('/addAddress',auth.isUserLogin,userController.addAddress)
userRouter.get('/editaddress',auth.isUserLogin,userController.getEditAddress)
userRouter.post('/editaddress',auth.isUserLogin,userController.editAddress)
userRouter.get('/deleteAddress',auth.isUserLogin,userController.deleteAddress)
userRouter.get('/profile',auth.isUserLogin,userController.getProfile)
userRouter.get('/catproduct',userController.getCategoryData)
userRouter.get('/orderDetails',auth.isUserLogin,orderController.getOrderDetails)
userRouter.get('/productDetails',userController.getProductDeatails)
userRouter.get('/editprofile',auth.isUserLogin,userController.getProfileEdit)
userRouter.put('/editprofile',auth.isUserLogin,userController.editProfile)
userRouter.post('/verify-payment',auth.isUserLogin,orderController.verifyPayment)
userRouter.get('/cance-order',auth.isUserLogin,orderController.cancelOrder)
userRouter.post('/add-coupon/:id',auth.isUserLogin,orderController.addcoupon)
userRouter.get('/orderStatus',auth.isUserLogin,orderController.orderStatus)
userRouter.get('/returnOrder',auth.isUserLogin,orderController.returnOrder)
 


module.exports = userRouter; 