const User = require('../models/user_model'); 
const Product = require('../models/product_model')
const Cart = require('../models/cart')
const Orders = require('../models/order')
const Coupon = require('../models/coupon')
const Category = require('../models/category')
require('dotenv').config();
const Razorpay = require('razorpay');
const cart = require('../models/cart');
const instance = new Razorpay({
    key_id:'rzp_test_dCipjxzSRdIN7F',
    key_secret:'XHWtjhusYGD6SFC4xvieFm7T',
  });
let isUser;
let message;
let index;
let newOrder;

///addcoupon
const addcoupon = async(req,res)=>{
    try {
            const userId = req.session.user_id
            const couponCode = req.params.id
            const coupon = await Coupon.findOne({ name: couponCode, expiry_date: { $gte: Date.now() } })
            if (coupon) {
                let exist = await Coupon.findOne({ name: couponCode, users: { $in: userId } })
                if (exist) {
                    res.json({ exist: true })
                } else {
                    const cart = await Cart.findOne({ user: userId })
                    const amount = ((cart.total / 100) * coupon.discount).toFixed(0)
                    const grandTotal = cart.total - amount
                    console.log(grandTotal);
                    const newCoupon = await Cart.findOneAndUpdate({ user:userId}, { $set: { discount:amount , grandTotal } })
                    res.json({ success: true })
                }
            } else {
                    res.json({ error: true })
            }
    } catch (error) {
        console.log(error);
        res.status(500).send('serer error')
    }
}

///checkout
const getCheckout = async(req,res)=>{
    try {
        const chIndex =  req.query.index
        // console.log(chIndex);
        const cart = await Cart.findOne({user:req.session.user_id})
        const category = await Category.find({is_deleted:0})
        isUser = await User.findOne({_id:req.session.user_id})
        if(cart?.items.length > 0){
          const order=req.session.order
          res.render('users/checkout',{isUser,message,chIndex,cart,order,category})
          message = null
        }else{
          res.redirect('/cart')
          
        }
    } 
    catch (error) {
        console.log(error);
    }
}

const addCheckout = async(req,res)=>{  
  try {
    const userId = req.session.user_id
    const carts = await Cart.findOne({ user: userId })
    const user = await User.findOne({ _id: userId });
    const orders = req.body
    address = user.address[orders.address];
    const products = carts.items
    const items = products.map((product) => {
        return { product: product.productId, quantity: product.quantity,price:product.price };
    });
    const paymentStatus = orders['payment-method'] === 'COD' ? 'Pending' : 'Paid'
    const orderStatus = orders['payment-method'] === 'COD' ? 'Processing' : 'Pending'
           
            if (req.body['payment-method'] == 'COD') {
                const newOrder = new Orders({
                    userId: userId,
                    paymentType: orders['payment-method'],
                    item:items,
                    address,
                    totalPrice: carts.total,
                    discount: carts.discount,
                    grandTotal: carts.total-carts.discount,
                    paymentStatus: paymentStatus,
                    orderStatus: orderStatus,
                    date: new Date(),
                })   
                await newOrder.save().then(()=>{
                    products.forEach(async (el) => {
                        await Product.findOneAndUpdate(
                            { _id: el.productId },
                            { $inc: { stock: -el.quantity } }
                        );
                    });
                })
                await Cart.deleteOne({ user: userId })
                res.json({ status: true })
            } else if (req.body['payment-method'] == 'online') {
                    newOrder = new Orders({
                    userId: userId,
                    paymentType: orders['payment-method'],
                    item:items,
                    address,
                    totalPrice: carts.total,
                    discount: carts.discount,
                    grandTotal: carts.total-carts.discount,
                    paymentStatus: paymentStatus,
                    orderStatus: orderStatus,
                    date: new Date(),
                })   
                const orderId = newOrder._id.valueOf()
                const totalPrice = newOrder.totalPrice
                const grandTotal = newOrder.grandTotal
                // console.log(grandTotal); 
                if (grandTotal == null) {
                    let options = {
                        amount: totalPrice * 100,
                        currency: "INR",
                        receipt: orderId
                    }
                    instance.orders.create(options, (err, order) => {
                        console.log(order);
                        if (err) {
                            console.log(err);
                        }
                        res.json({ order, user })
                    })
                } 
                else {
                    let options = {
                        amount: grandTotal * 100,   
                        currency: "INR",
                        receipt: orderId
                    }
                    instance.orders.create(options, (err, order) => {
                        if (err) {
                            console.log(err);
                        }
                        res.json({ order, user })
                    })
                }
            } else if (req.body['payment-method'] == 'wallet') {
                // const user = await User.findOne({ _id: userId })
                // const order = await Orders.findOne({ userId: userId })
                // const carts = await Cart.findOne({ user: userId })
                // const orderId = order._id
                const total = carts.total
                const grandTotal = carts.total-carts.discount
                const walletAmount = user.wallet
                if (walletAmount == 0 || walletAmount < total) {
                    res.json({ zeroWallet: true })
                } else {
                    const newOrder = new Orders({
                        userId: userId,
                        paymentType: orders['payment-method'],
                        item:items,
                        address,
                        totalPrice: carts.total,
                        discount: carts.discount,
                        grandTotal: carts.total-carts.discount,
                        paymentStatus: paymentStatus,
                        orderStatus: orderStatus,
                        date: new Date(),
                    })   
                    await newOrder.save().then(()=>{
                        products.forEach(async (el) => {
                            await Product.findOneAndUpdate(
                                { _id: el.productId },
                                { $inc: { stock: -el.quantity } }
                            );
                        });
                    })
                    if (grandTotal == null) {
                        
                        // if (walletAmount < total) {
                            // const balancePayment = total - walletAmount
                            // orderId = newOrder._id.valueOf()
                            // let options = {
                            //     amount: balancePayment * 100,
                            //     currency: "INR",
                            //     receipt: orderId
                            // }
                            // instance.orders.create(options, (err, order) => {
                            //     if (err) {
                            //         console.log(err);
                            //     }
                            //     res.json({ order, user })
                            // })
                        // } else {
                            await Cart.deleteOne({ user: userId })
                            const balanceWallet = walletAmount - total
                            await User.findOneAndUpdate({ _id: userId }, {
                                $set: {
                                    wallet: balanceWallet
                                }
                            }).then(() => {
                                res.json({ status: true })
                            })
                        // }
                    } else {
                        await Cart.deleteOne({ user: userId })
                        if (walletAmount < grandTotal) {
                            const balancePayment = grandTotal - walletAmount
                            orderId = newOrder._id.valueOf()
                            let options = {
                                amount: balancePayment * 100,
                                currency: "INR",
                                receipt: orderId
                            }
                            instance.orders.create(options, (err, order) => {
                                if (err) {
                                    console.log(err);
                                }
                                res.json({ order, user })
                            })
                        } else {
                            const balanceWallet = walletAmount - grandTotal
                            await User.findOneAndUpdate({ _id: userId }, {
                                $set: {
                                    wallet: balanceWallet
                                }
                            }).then(() => {
                                res.json({ status: true })
                            })
                        }
                    }
                }
            } else {
                res.json({ noSelect: true })
            }
        
}catch (error) {
        console.log(error);
        res.status(500).send('serer error')
    }
}

const verifyPayment = async(req,res)=>{
    try {
        const userId = req.session.user_id
        const carts = await Cart.findOne({ user: userId })
    const user = await User.findOne({ _id: userId });
    const orders = req.body
    address = user.address[orders.address]
    const products = carts.items
    const items = products.map((product) => {
        return { product: product.productId, quantity: product.quantity,price:product.price };
    });
    const paymentStatus = orders['payment-method'] === 'COD' ? 'Pending' : 'Paid'
    const orderStatus = orders['payment-method'] === 'COD' ? 'Processing' : 'Pending'
            
            const details = req.body
            const orderId = req.body.order.order.receipt
           
            await newOrder.save().then(()=>{
                products.forEach(async (el) => {
                    await Product.findOneAndUpdate(
                        { _id: el.productId },
                        { $inc: { stock: -el.quantity } }
                    );
                });
            })
                await Cart.deleteOne({ user: userId })
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'XHWtjhusYGD6SFC4xvieFm7T')
            hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
            hmac = hmac.digest('hex')
            let walletAmount = await User.findOne({ _id: userId })
            if (walletAmount == null) {
                if (hmac == details.payment.razorpay_signature) {
                    await Orders.updateOne({ _id: orderId }, {
                        $set: {
                            orderStatus: 'Processing',
                            paymentStatus: 'Paid'
                        }
                    }).then(() => {
                        res.json({ status: true })
                    }).catch((err) => {
                        console.log(err);
                        res.json({ status: false, errMsg: '' })
                    })
                }
            } else {
                if (hmac == details.payment.razorpay_signature) {
                    await Orders.updateOne({ _id: orderId }, {
                        $set: {
                            orderStatus: 'Processing',
                            paymentStatus: 'Paid'
                        }
                    })
                    await User.updateOne({ _id: userId }, {
                        $set: {
                            walletAmount: 0
                        }
                    })
                        .then(() => {
                            res.json({ status: true })
                        }).catch((err) => {
                            console.log(err);
                            res.json({ status: false, errMsg: '' })
                        })
                }
            }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error')
    }
}
  const getOrderDetails = async(req,res) => {
    try {
      const category = await Category.find({is_deleted:0})
      isUser = req.session.user_id
      const orders = await Orders.find({ userId: isUser})
      .sort({ _id: -1 })
      .populate("item.product");
      const user = await Orders.findOne({userId:isUser})
      if(user){ 
          res.render('users/orderDetail', { orders, isUser, message,category });
          message = null
      }else{
        res.redirect('/profile')
      }
    } catch (error) {
      console.log(error);
      res.status(500).send('server error')
    }
  }

  const cancelOrder = async(req,res)=>{
    try {
        const userId = req.session.user_id
        const orderId = req.query.id;
        const orders = await Orders.findOne({_id:orderId})
        await Orders.findByIdAndUpdate(
                { _id: orderId },
                { $set: { orderStatus: "Cancelled",
                user_cancelled:true } }
            );
            if(orders.paymentType !== 'COD'){
                await User.findOneAndUpdate({_id:userId},{$inc:{wallet:orders.grandTotal}})
            }
            res.redirect("/orderDetails");
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
  }
  const orderStatus = async(req,res)=>{
    try {
        isUser = req.session.user_id
        const orderId  = req.query.id
        const category = await Category.find({is_deleted:0})
        const orders = await Orders.findOne({ _id: orderId }).populate('item.product')
        res.render('users/orderStatus',{isUser,orders,category})
    } catch (error) {
        console.log(error);
        res.status(500).send('server error')
    }
  }

  const returnOrder = async (req, res) => {
    try {
        const orderId = req.query.id;
        const itemId = req.query.proid
        const userId = req.session.user_id
        let orders = await Orders.findOne({ _id: orderId })
        let paymentType = orders.paymentType
        // console.log(orders);
        let price = orders.item[0].price
        
        if (paymentType !== 'COD') {
            await Orders.findByIdAndUpdate(
                { _id: orderId },
                {
                    $set:
                    {
                        orderStatus: "returned",
                        paymentStatus: "refund success"
                    }
                }
            )
            await User.findOneAndUpdate({_id:userId},{$inc:{wallet:price}})
            res.redirect('/orderDetails')
            message = "Returned Fund Refunded your Wallet"
           
        } else {
            await Orders.findByIdAndUpdate(
                { _id: orderId },
                {
                    $set:
                    {
                        orderStatus: "returned",
                        
                    }
                }
            )
            
            res.redirect('/orderDetails')
            message = "Returned"
        }
    } catch (error) {
       console.log(error);
       res.status(500).send('server error')
    }
}

module.exports = {
    getCheckout,
    addCheckout,
    getOrderDetails,
    verifyPayment,
    cancelOrder,
    addcoupon,
    orderStatus,
    returnOrder,
}