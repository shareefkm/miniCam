const User = require('../models/user_model'); 
const Product = require('../models/product_model')
const Cart = require('../models/cart')
const Category = require('../models/category')


let message;

const addToCart = async(req,res)=>{
    try {
        const userId = req.session.user_id;
        if(userId){
            const proId = req.params.id;
            const prodData = await Product.findOne({_id:proId});
            const userCart  = await Cart.findOne({user:userId});
            if(prodData.stock >0){                    
                if(userCart){
                    const proExist = userCart.items.findIndex(items=>items.productId == proId)
                    if(proExist!=-1){
                        await Cart.updateOne({user: userId,"items.productId": proId },
                        {
                            $inc:{
                                "items.$.quantity": 1,
                                "items.$.price":prodData.price,
                        },
                        
                        }
                        )
                        res.json({status:true})
                        
                    }else{
                        await Cart.updateOne({user: userId},{
                            $push:{
                                items:{
                                    productId:prodData._id,
                                    price:prodData.price, 
                                }
                            },
                            
                        })
                        res.json({status:true})
                        
                    }
                }else{
                    const addCart = new Cart({
                       user:userId,
                       items:[{
                        productId:prodData._id,
                        price:prodData.price,
                       }],
                    
                    })
                    await addCart.save()
                    res.json({status:true})
                    
                }
            }else{
                res.json({ response: "outofstock" });
            }
        }else{
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("server error")
    }
}

const getCart = async(req,res)=>{
    try {
        const category = await Category.find({is_deleted:0})
        const isUser = await User.findOne({_id:req.session.user_id})
        const cartData = await Cart.findOne({user:req.session.user_id}).populate('items.productId')
        if(cartData){
            const subtotal = cartData.items.map((value) => {
                return value.price
            }).reduce((total, value) => {
                return total = total + value
            }, 0)
            await Cart.updateOne({user:isUser},{$set:{total:subtotal}}) 
            res.render('users/cart', { isUser, cartData, subtotal,message,category })
            message = null
        }else{
            res.render('users/cart', { isUser, cartData,category,message :"Cart empty" })
            message = null
        }    
    } catch (error) {
        console.log(error);
    }
}

const decrement = async (req, res, next) => {
    try {
        const user_id = req.session.user_id
        const ProductID = req.query.id
        let cartData = await Cart.findOne({ user: user_id, 'items.productId': ProductID })
        const productData = await Product.findOne({ _id: ProductID })
        let cartProductDatial = cartData.items.filter(value => {
            return value.productId == ProductID
        })
        if (cartProductDatial[0].quantity <= 1) {
            res.json({ x : "" })
        } else {

            const Cartdecrement = await Cart.updateOne({ user: user_id, "items.productId": ProductID }, { $inc: { 'items.$.quantity': -1 } })

            cartData = await Cart.findOne({ user: user_id, 'items.productId': ProductID })
            cartProductDatial = cartData.items.filter(value => {
                return value.productId == ProductID
            })
        
            const price = productData.price
            const quantity = cartProductDatial[0].quantity
            const totalprice = price * quantity
            const updateCart = await Cart.findOneAndUpdate({ user: user_id, 'items.productId': ProductID }, {
                $set: {
                    'items.$.price': totalprice,   
                }
            })
            cartData = await Cart.findOne({ user: user_id, 'items.productId': ProductID })
            const subtotal = cartData.items.map((value) => {
                return value.price
            }).reduce((total, value) => {
                return total = total + value
            }, 0)
           
            await Cart.updateOne({ user: user_id }, { $set: { total: subtotal} })
            res.json({ quantity, totalprice, ProductID, subtotal })
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('server error')
    }
}
const increment = async (req, res, next) => {
    try {
        const user_id = req.session.user_id
        const ProductID = req.query.id
        const productData = await Product.findOne({ _id: ProductID })
        let cartData = await Cart.findOne({ user: user_id, 'items.productId': ProductID })
        let cartProductDatial = cartData.items.filter(value => {
            return value.productId == ProductID
        })
        if (productData.stock <= cartProductDatial[0].quantity) {
            message = "Maximum Stock Done"
            res.json({ outOfStock: true })
        } else {

            await Cart.updateOne({ user: user_id, "items.productId": ProductID }, { $inc: { 'items.$.quantity': 1 } })
            cartData = await Cart.findOne({ user: user_id, 'items.productId': ProductID })
            cartProductDatial = cartData.items.filter(value => {
                return value.productId == ProductID
            })
            
            const price = Number( productData.price)
            const quantity = Number(cartProductDatial[0].quantity)
            const totalprice = Number(price * quantity)
            await Cart.findOneAndUpdate({ user: user_id, 'items.productId': ProductID }, {
                $set: {
                    'items.$.price': totalprice,
                }
            })
            cartData = await Cart.findOne({ user: user_id, 'items.productId': ProductID })
            const subtotal = cartData.items.map((value) => {
                return Number(value.price)
            }).reduce((total, value) => {
                return total = total + value
            }, 0)

            await Cart.updateOne({ user: user_id }, { $set: { total:Number(subtotal) } })
            res.json({ quantity, totalprice, ProductID, subtotal })
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('server error')
    }
}

const removeCartItem = async(req,res)=>{
    try {
        const proId = req.body.product;
        const userId = req.session.user_id;
        const proData = await Product.findOne({_id:proId})
        await Cart.updateOne({user:userId},
            {
               $pull:{
                items:{
                    productId:proId
                }
               },
               $inc:{
                total:-proData.price,
                grandTotal:-proData.price
               }
            })
            res.json({removeProduct:true})

    } catch (error) {
        console.log(error);
    }
}

const wishlist = async(req,res)=>{

    try{
        const category = await Category.find({is_deleted:0})
        const isUser = req.session.user_id 
        const items = await User.findOne({_id:session}).populate('wishlist');  
        if(!wishlist){
            res.render('wishlist',{items:[],isUser,category});
            return;
        }
        res.render('wishlist',{items,isUser,category});

    }
    catch (error){
        console.log(error.message)
    }

}

const addtowishlist = async(req,res)=>{
    if(req.session.user_id){
        const productid = req.query.id
        const userId = req.session.user_id
        console.log(productid);
        try{
            const user = await User.findById({_id:userId})
            if(user.wishlist.includes(productid)){
               res.redirect('/wishlist')
            }

            user.wishlist.push(productid)
            await user.save()
            res.redirect('/wishlist')

        }
        catch (error){
            console.log(error.message);
            return res
            .status(500)
            .json({message:"server error"});

        }
    }else{
        res.redirect('/login');
    }

}

const removewishlist = async(req,res)=>{
    try{
        const productid = req.query.id
        const session = req.session.user_id
        const user = await User.findById({_id:session})
        console.log(user);
        user.wishlist.pull(productid);
        await user.save()
        res.redirect('/wishlist');

    }
    catch (error){
        console.log(error.message);
    }
}

module.exports = {
    addToCart,
    getCart,
    decrement,
    increment,
    removeCartItem,
}