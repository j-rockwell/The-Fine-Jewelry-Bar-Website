const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    /**
     * Listing ID
     */
    listing : {
        type : String,
        required : true
    },

    /**
     * Option ID
     */
    option : {
        type : String,
        required : true
    },

    /**
     * Size
     * Not required
     */
    size : {
        type : Number,
        required : false
    }
});

module.exports = mongoose.model('CartItem', CartItemSchema);