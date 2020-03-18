const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    /**
     * Listing ID
     */
    listing : {
        type : String,
        required : true
    },

    /**
     * Listing Option ID
     */
    option : {
        type : String,
        required : true
    },

    /**
     * Size
     */
    size : {
        type : Number,
        required : false
    }
});

module.exports = mongoose.model('OrderItem', OrderItemSchema);