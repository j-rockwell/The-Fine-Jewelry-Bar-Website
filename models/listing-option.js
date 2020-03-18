const mongoose = require('mongoose');

const ListingOptionSchema = new mongoose.Schema({
    /**
     * Option Identifier
     */
    identifier : {
        type : String,
        required : true
    },

    /**
     * Manufacturer SKU
     */
    sku : {
        type : String,
        required : true
    },

    /**
     * Order Type
     * 'READY TO SHIP' = 0, 'REQUESTABLE FROM VENDOR' = 1, 'SPECIAL ORDER' = 2
     */
    ordertype : {
        type : Number,
        default : 0
    },

    /**
     * Metal
     */
    metal : {
        type : String,
        required : true
    },

    /**
     * Gemstone
     */
    gemstone : {
        type : String,
        required : false
    },

    /**
     * Listing Option Sizes
     */
    sizes : [Number],

    /**
     * Cost
     * What we pay to the designer/vendor
     */
    cost : {
        type : Number,
        required : true
    },

    /**
     * Price
     * What the customer is paying
     */
    price : {
        type : Number,
        required : true
    },

    /**
     * Quantity
     */
    quantity : {
        type : Number,
        required : true
    }
});

module.exports = mongoose.model('ListingOption', ListingOptionSchema);