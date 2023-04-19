const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryname:{
        type: String,
        uppercase: true,
        required: true,
    },
    is_deleted:{
        type:Number,
        default:0
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }]
})

module.exports = mongoose.model('Category',categorySchema)
