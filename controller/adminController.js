const User = require('../models/user_model'); 
const Category = require('../models/category')
const Product = require('../models/product_model')
const bcrypt = require('bcrypt');
const Cart = require('../models/cart')
const Coupon = require('../models/coupon')
const Orders = require('../models/order')
const Banner = require('../models/banner');
const moment = require('moment')
const sharp = require('sharp')
 
let adMsg;

const getAdminHome = async(req,res)=>{
    try {

        const totalSale = await Orders.aggregate([
            {$match : {paymentStatus:'Paid'}},
            {$group : {_id : null, total : {$sum :"$grandTotal"}}}])
        const totalUsers = await User.aggregate([{$group : {_id : null,total :{$count :{}}}}])
        const totalProduct = await Product.aggregate([{$group : {_id : null , total : {$count : {}}}}])
        const totalOrders = await Orders.aggregate([
            {$match : {$and : [{is_returned : 0},{is_delivered :true}]}},
            {$group : {_id : null, total : {$count : {}}}}])
            const saleChart = await Orders.aggregate([{$group : {_id : "$paymentType", total : {$count : {}}}}])
        const start = moment().startOf('month')
        const end = moment().endOf('month')
        const date = new Date()
        const year = date.getFullYear()
        const currentYear = new Date(year,0,1)
        
        const salesByYear = await Orders.aggregate([
            {$match : {
                createdAt :{$gte : currentYear},status:{$ne : "cancelled"}
            }},
            {$group : {
                _id : {$dateToString : {format : "%m", date : "$createdAt"}},
                total : {$sum : "$grandTotal"},
                count : {$sum : 1}
            }},
            {$sort : {_id : 1}}
        ])
        let sales = []
        for (i = 1; i< 13; i++){
            let result = true
            for(j = 0; j < salesByYear.length; j++){
                result = false 
                if(salesByYear[j]._id == i){
                    sales.push(salesByYear[j])
                    break;
                }else {
                    result = true
                    
                }
            }
            if(result){
                sales.push({_id : i, total : 0, count : 0})
            }
            
        }
        let yearChart = []
        for(i = 0; i < sales.length; i++){
            yearChart.push(sales[i].total)
        }


        const usersData = await User.find({is_admin:0})
        const orders = await Orders.find().populate('userId').sort({_id:-1})
        res.render('admin/admin_home',{adMsg,users:usersData,orders,totalSale,totalUsers,totalProduct,totalOrders,saleChart,yearChart})
        adMsg = null;
    } catch (error) {
        console.log(error);
    }
}
const loadAdminLogin = async(req,res)=>{
    try {        
        res.render('admin/adminLogin',{adMsg})
        adMsg = null; 
    } catch (error) {
        console.log(error);
    }
} 
const verifyAdmin = async(req,res)=>{
    try {
        const adminData = await User.findOne({email:req.body.email});
        if(adminData){
        const confPass = await bcrypt.compare(req.body.password,adminData.password)
        if(confPass){
            if(adminData.is_admin !== 0){
                req.session.admin_id = adminData._id
                res.redirect('/admin/adminhome')
            }else{
                res.redirect('/admin')
                adMsg = "Inavalid Admin"    
            } 
        }else{
            res.redirect('/admin')
            adMsg = "Inavalid Admin"

        }
        }else{
            res.redirect('/admin')
            adMsg = "Inavalid Admin"
        }
    } catch (error) {
        console.log(error)
    }
}
const adminLogout = async(req,res)=>{
    try {
        req.session.admin_id = null
        res.redirect('/admin')
    } catch (error) {
        console.log(error);
    }
}
const getUsers = async(req,res)=>{
    try {
        const usersData = await User.find({is_admin:0})
        res.render('admin/users',{adMsg,users:usersData})
        adMsg=null
    } catch (error) {
        console.log(error);
    }
}
const blockUser = async(req,res)=>{
    try {
        const id = req.query.id
        const updateUser = await User.findOne({_id:id})
        if(updateUser.is_blocked === 0){
            await User.updateOne({_id:id},{$set:{is_blocked:1}})
                req.session.user_id = null;
            res.redirect('/admin/users')
            adMsg = "Blocked "+updateUser.name
        }else{
            await User.updateOne({_id:id},{$set:{is_blocked:0}})
            res.redirect('/admin/users')
            adMsg = "Unblocked "+updateUser.name
        }
    } catch (error) {
        console.log(error);
    }
}
const getCategory = async(req,res)=>{
    try {
        const categoryData = await Category.find({});
        res.render('admin/category',{adMsg,category:categoryData})
        adMsg = null
    } catch (error) {
        console.log(error);
    }
}
const inserCategory = async(req,res)=>{
    try {
        const findCategory = await Category.findOne({categoryname:req.body.Category})
        if(findCategory){
            res.redirect('/admin/category') 
            adMsg = "Category Allready Existed"
        }else{
            const category = new Category({
                categoryname:req.body.Category,  
            })
            await category.save();
            res.redirect('/admin/category')
            adMsg = "Category Added"
        } 

    } catch (error) {
        console.log(error);
    }
}
const getEditCategory = async(req,res)=>{
    try {
        const id = req.query.id
        const categoryData = await Category.findOne({_id:id})
        res.render('admin/editCategory',{adMsg,category:categoryData})
        adMsg = null;
    } catch (error) {
        console.log(error);
    }
}
const editCategory = async(req,res)=>{
    try {
        const id = req.query.id
        const findCategory = await Category.findOne({categoryname:req.body.Category})
        if(findCategory){
            res.redirect('/admin/category') 
            adMsg = "Category Allready Existed"
        }else{
               await Category.findOneAndUpdate({_id:id},{
                $set:{
                    categoryname:req.body.Category,    
                }})
                res.redirect('/admin/category')
                adMsg = "Category Ediited"
        }
    } catch (error) {
        console.log(error);
    }
}
const deleteCategory = async(req,res)=>{
    try {
        const id = req.query.id
        const categoryData = await Category.findOne({_id:id})
        if(categoryData.is_deleted === 0){
            await Category.updateOne({_id:id},{$set:{is_deleted:1}})
            res.redirect('/admin/category')
            adMsg = "Category Deleted"
            
        }else{
            await Category.updateOne({_id:id},{$set:{is_deleted:0}})
            res.redirect('/admin/category')

        }
    } catch (error) {
        console.log(error);
    }
}

///product mangement////
const getProducts = async(req,res)=>{
    try {
        const productsData = await Product.find({})
        res.render('admin/products',{adMsg,products:productsData})
        adMsg = null;
    } catch (error) {
        console.log(error);
    }
}
const getAddProduct = async(req,res)=>{
    try {
        const categoryData = await Category.find({});
        res.render('admin/addProduct',{adMsg,category:categoryData})
        adMsg = null;
    } catch (error) {
        console.log(error);
    }
}
const addProduct = async(req,res)=>{
    try {
        const category = await Category.findOne({categoryname:req.body.category})
        const images = req.files.map(file => ({ path: file.filename }))
        const products = new Product({
            name:req.body.Name,
            description:req.body.Description,
            price:req.body.Price,
            stock:req.body.stock,
            category:req.body.category,
            image:images
        })
        const productData = await products.save()
        if(productData){
            res.redirect('/admin/product')
            adMsg = "product added success";
        }else{
            res.redirect('/admin/addProduct')
            adMsg = "product added failed";
        }
        category.products.push(products._id);
        const proid = await category.save();
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}





const getEditproduct = async(req,res)=>{
    try {
        const id = req.query.id
        const categoryData = await Category.find({});
        const productsData = await Product.findOne({_id:id})
        res.render('admin/editProduct',{adMsg,products:productsData,category:categoryData})
        adMsg = null;
    } catch (error) {
        console.log(error);
    }
}
const editProduct = async(req,res)=>{
    try {
        const mongoose = require('mongoose');
        const id = req.query.id
        const category = await Category.findOne({categoryname:req.body.category})
        await Category.updateOne({ products: id }, { $pull: { products: id } });
        const images = await req.files.map(file => ({ path: file.filename }))
        await Product.updateOne({_id:req.query.id},{$push:{ image:images,}});
            await Product.findOneAndUpdate({_id:id},{
                $set:{
                    name:req.body.Name,
                    description:req.body.Description,
                    price:req.body.Price,
                    stock:req.body.stock,
                    category:req.body.category,
                }}) 
                category.products.push(id)
                let newCat = await category.save();
                res.redirect('/admin/product')
                adMsg = "product edited succecc";
                console.log(newCat);
        
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}

const getProductDeatails = async(req,res)=>{
    try {
        const proId = req.query.id
        const proDetail = await Product.findOne({_id:proId})
        res.render('users/productDetails',{proDetail})
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}


const delteProImage = async (req, res) => {
    try {
      const productId = req.query.productId;
      const index = req.query.index;
      await Product.updateOne(
        { _id: productId },
        { $unset: { [`image.${index}`]: "" } }
      );
      const deletedImages = await Product.updateOne(
        { _id: productId },
        { $pull: { image: null } }
      );
  
      
      res.redirect("/admin/editproduct?id=" + productId);
    } catch (error) {
      console.log(error);
      res.status(500).send("server error");
    }
  };
  
const deletProduct = async(req,res)=>{
    try {
        const id = req.query.id
        const deleteProduct = await Product.findOne({_id:id})
        if(deleteProduct.is_deleted === 0){
            await Product.updateOne({_id:id},{$set:{is_deleted:1}})
            res.status(200).redirect('/admin/product')
            adMsg = "Product Deleted"
        }else{
            await Product.updateOne({_id:id},{$set:{is_deleted:0}})
            res.status(200).redirect('/admin/product')

        }
    } catch (error) {
        console.log(error);
    }
}


/////coupon management////
const adminCoupon = async(req, res) => {
    try {
        const couponData = await Coupon.find()
        const couponCount = await Coupon.find().count();
        res.render('admin/addCoupon',{couponData,couponCount})
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}
  
  const addCoupon = async (req, res, next) => {
    try {
        let data = req.body
        const { name, code, discount, min_amount, max_discount, create_date, expiry_date } = data
        await Coupon({
            name: name,
            code: code,
            discount: discount,
            min_amount: min_amount,
            max_discount: max_discount,
            create_date: create_date,
            expiry_date: expiry_date
        }).save()
        res.redirect('/admin/coupon')
    } catch (error) {
      console.log(error);
      res.status(500).send('server error')
    }
  };
  
  const editCoupon = async (req, res) => {
    try {
        const couponId = req.query.id
        const editCoupon = req.body
        const { name, discount, min_amount, max_discount, expiry_date } = editCoupon
        await Coupon.updateOne({ _id: couponId }, {
            $set: {
                name: name,
                discount: discount,
                min_amount: min_amount,
                max_discount: max_discount,
                expiry_date: expiry_date
            }
        })
        res.redirect('/admin/coupon')
    } catch (error) {
        res.status(500),send('server error')
    }
}
  
  const deleteCoupon = async(req,res,next)=>{
      try {
        const couponId = req.query.id;
        console.log(req.query);
        await Coupon.deleteOne({ _id: couponId })
        res.redirect("/admin/coupon");
          
      } catch (error) {
          console.log(error)
      }
  };

  /////admin Order controll////

  const orderDelivered = async (req, res) => {
    try {
      const id = req.query.orderId;
       await Orders.updateOne(
        { _id: id },
        {
          $set: {
            is_delivered: true,
            delivered_date: Date.now(),
            orderStatus:'Delivered',
            paymentStatus:'Paid'
          },
        }
      );
      res.redirect("/admin/adminhome");
    } catch (error) {
      console.log(error);
      res.status(500).send('server error')
    }
  };
  ///confirm return//
  const returnConfirm = async(req,res)=>{
    try {
        const orderId = req.query.orderId;
        let orders = await Orders.findOne({ _id: orderId })
        const userId = orders.userId
        let price = orders.item[0].price
        let paymentType = orders.paymentType
        if (paymentType !== 'COD') {
            await Orders.findByIdAndUpdate(
                { _id: orderId },
                {
                    $set:
                    {
                        is_returned:1,
                        paymentStatus: "refund success"
                    }
                }
            )
            await User.findOneAndUpdate({_id:userId},{$inc:{wallet:price}})
            res.redirect('/admin/adminhome')
            message = "Fund Refunded Success"
           
        } else {    
            res.redirect('/admin/adminhome')
            message = "Return Confirmed"
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
  }

const getOrderView = async(req,res)=>{
    try {
        const id = req.query.orderid
        const orderData = await Orders.findOne({ _id:id }).populate("item.product")
        if(id){
            res.render('admin/orderPage',{orders: orderData})
        }else{
            res.redirect("/admin/adminhome");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}
  
  const cancelOrder = async(req,res)=>{
    try {
        const orderId = req.query.orderid;
        await Orders.findByIdAndUpdate(
                { _id: orderId },
                { $set: { orderStatus: "Cancelled",
                admin_cancelled:true } }
            );
            const orderDetails = await Orders.findOne({ _id: orderId });
    if (
      orderDetails.paymentType === "online" ||
      orderDetails.paymentType === "wallet"
    ) {
      increaseAmount = orderDetails.grandTotal;
      console.log(increaseAmount);
      await User.updateOne(
        { _id: orderDetails.userId },
        { $inc: { wallet: increaseAmount } }
      );
    }
            res.redirect("/admin/adminhome");
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
  }

  // BANNER PAGE
const adminBanner = async (req, res) => {
    try {
        let banners = await Banner.find()
        res.render('admin/adminBanner', {banners})
    } catch (error) {
        res.status(500).send('server error')
    }
}

  // ADD BANNER
  const addBanner = async (req,res) => {
    try {
        res.render('admin/addBanner')
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}


const doaddBanner = async (req,res) => {
    try { 
        let { des1, des2, des3 } = req.body;
        let image = req.file.filename
        await Banner({
            Des1: des1,
            Des2: des2,
            Des3: des3, 
            image: image
        }).save();

        res.redirect('/admin/banner');
    } catch (error) {
        console.log(error);
        res.status(500).send('server error');
    }
}
const editBanner = async (req, res) => {
    try {
        let editId = req.query.id
        const banner = await Banner.findOne({ _id: editId })
        res.render('admin/editBanner', { Banner:banner })
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}

// EDIT BANNER
const doEditBanner = async (req, res) => {
    try {
        let editId = req.query.id
        let image = req.file.filename
        await Banner.updateOne({ _id: editId }, {
            $set: {
                image: image
            }
        })
        res.redirect('/admin/banner')
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
}
const deleteBanner = async (req, res) => {
    let deleteBanner = req.query.id
    await Banner.deleteOne({ _id: deleteBanner })
    res.redirect('/admin/banner')
}


  const salesReport = async (req, res, next) => {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate)
        : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
  
      const query = {
        paymentStatus: "Paid",
        orderStatus: "Delivered",
      };
      if(startDate != null){
          const data = await Orders.aggregate([{
              $match :{
                 $and :[{ start_date : {$gte: startDate }},
                  {start_date : {$lte: endDate }},{paymentStatus : "Paid"},{orderStatus : "Delivered"}]
              }
          }])
          const salesReport = data
          res.render("admin/salesReport", { salesReport });
      }else {
          const salesReport = await Orders.find(query);
          res.render("admin/salesReport", { salesReport });
      }
  
    } catch (error) {
      console.log(error);
      res.status(500).send('server error')
    }
  };
  
module.exports = {
    loadAdminLogin,
    verifyAdmin,
    getAdminHome,
    adminLogout,
    blockUser,
    inserCategory,
    editCategory,
    getEditCategory,
    deleteCategory,
    getAddProduct,
    addProduct,
    getEditproduct,
    editProduct,
    deletProduct,
    getProducts,
    getCategory,
    getUsers,
    adminCoupon,
    addCoupon,
    deleteCoupon,
    editCoupon,
    delteProImage,
    orderDelivered,
    getOrderView,
    cancelOrder,
    salesReport,
    getProductDeatails,
    addBanner,
    doaddBanner,
    adminBanner,
    editBanner,
    doEditBanner,
    deleteBanner,
    returnConfirm,
    
}