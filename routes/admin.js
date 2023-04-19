const express = require('express');
const adminRouter = express.Router();
const bodyParser = require('body-parser')
const path = require('path')
const multer = require('multer')
const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,'../public/images/product'))
    },
    filename:(req,file,cb)=>{
        const name = Date.now()+'-'+file.originalname;
        cb(null,name)
}
})
const upload = multer({storage:storage})


const auth = require('../middleware/auth')
const userHelpers = require('../controller/userController'); 
const adminHelpers = require('../controller/adminController'); 

adminRouter.use(bodyParser.json());
adminRouter.use(bodyParser.urlencoded({extended:true}));

adminRouter.get('/adminhome',auth.isAdminLogin,adminHelpers.getAdminHome)
adminRouter.get('/',auth.isAdminLogout,adminHelpers.loadAdminLogin)
adminRouter.post('/',auth.isAdminLogout,adminHelpers.verifyAdmin)
adminRouter.get('/logout',auth.isAdminLogin,adminHelpers.adminLogout)
adminRouter.get('/users',auth.isAdminLogin,adminHelpers.getUsers)
adminRouter.get('/blockUser',auth.isAdminLogin,adminHelpers.blockUser)
adminRouter.post('/addcategory',auth.isAdminLogin,adminHelpers.inserCategory)
adminRouter.post('/edit-category',auth.isAdminLogin,adminHelpers.editCategory)
adminRouter.get('/deletecategory',auth.isAdminLogin,adminHelpers.deleteCategory)
adminRouter.get('/addproduct',auth.isAdminLogin,adminHelpers.getAddProduct)
adminRouter.post('/addproduct',upload.array('file',5),auth.isAdminLogin,adminHelpers.addProduct)
adminRouter.get('/editproduct',auth.isAdminLogin,adminHelpers.getEditproduct)
adminRouter.post('/editproduct',upload.array('file',5),auth.isAdminLogin,adminHelpers.editProduct)   
adminRouter.get('/deleteproduct',auth.isAdminLogin,adminHelpers.deletProduct)
adminRouter.get('/product',auth.isAdminLogin,adminHelpers.getProducts)
adminRouter.get('/productDetails',adminHelpers.getProductDeatails)
adminRouter.get('/category',auth.isAdminLogin,adminHelpers.getCategory)
adminRouter.get('/deleteimage',auth.isAdminLogin,adminHelpers.delteProImage)
adminRouter.get('/coupon',auth.isAdminLogin,adminHelpers.adminCoupon)
adminRouter.post('/coupon',auth.isAdminLogin,adminHelpers.addCoupon)
adminRouter.post('/editCoupon',auth.isAdminLogin,adminHelpers.editCoupon)
adminRouter.get('/deleteCoupon',auth.isAdminLogin,adminHelpers.deleteCoupon)
adminRouter.get('/orderStatus', auth.isAdminLogin, adminHelpers.orderDelivered);
adminRouter.get('/cancelOrder',auth.isAdminLogin,adminHelpers.cancelOrder)
adminRouter.get('/salesReport',auth.isAdminLogin,adminHelpers.getSalesReport)
adminRouter.get('/vieworder',auth.isAdminLogin,adminHelpers.getOrderView)
// adminRouter.get('*',(req,res)=>{
//     res.redirect('/admin')
// })    
// salesReport
module.exports = adminRouter;   