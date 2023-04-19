/* eslint-disable no-undef */
const mongoose = require('mongoose')
const moment = require('moment')
const Objectid = mongoose.Types.ObjectId
const couponSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    discount: {
        type: Number,
        default: 0
    },
    min_amount: {
        type: Number,
    },
    max_discount: {
        type: Number,
    },
    startDate:{
        type:String,
        default:moment().format("DD/MM/YYYY")+" "+moment().format("hh:mm:ss")
       },
    expiry_date: {
        type: Date,
    },
    users: [{
        type:Objectid,
        ref: 'User'
    }
    ],
    is_deleted: { type: Boolean, default: false }
})

module.exports = couponModel = mongoose.model('coupons', couponSchema)