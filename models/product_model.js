const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    image:[{
        path:{
        type:String,
        }
    }],
    is_vishlist:{
        type:Number,
        default:0
    },
    is_deleted:{
        type:Number,
        default:0
    }
})
module.exports = mongoose.model('Product',productSchema)