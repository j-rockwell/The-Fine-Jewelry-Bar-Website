const mongoose = require('mongoose');
const OrderItemSchema = require('./order-item').schema;

const OrderSchema = new mongoose.Schema({
    /**
     * User ID
     */
    owner : {
        type : String,
        required : true
    },
    
    /**
     * Authorize.net Transaction ID
     */
    transaction : {
        type : String,
        required : true
    },

    /**
     * Order Status
     * 0 = AWAITING APPROVAL, 1 = AWAITING SHIPMENT, 2 = SHIPPED, 3 = COMPLETED, 4 = SPECIAL ORDER IN PROGRESS
     */
    status : {
        type : Number,
        required : true,
        default : 0
    },

    /**
     * Shipping Tracking #
     */
    shipping_tracking : {
        type : String,
        required : false
    },

    /**
     * Ship to First Name
     */
    shipping_firstname : {
        type : String,
        required : true
    },

    /**
     * Ship to Last Name
     */
    shipping_lastname : {
        type : String,
        required : true
    },

    /**
     * Ship to Address
     */
    shipping_address : {
        type : String,
        required : true
    },

    /**
     * Ship to City
     */
    shipping_city : {
        type : String,
        required : true
    },

    /**
     * Ship to State
     */
    shipping_state : {
        type : String,
        required : true
    },

    /**
     * Ship to ZIP Code
     */
    shipping_zip : {
        type : String,
        required : true
    },

    /**
     * Contact First Name
     */
    contact_firstname : {
        type : String,
        required : true
    },

    /**
     * Contact Last Name
     */
    contact_lastname : {
        type : String,
        required : true
    },

    /**
     * Contact Email
     */
    contact_email : {
        type : String,
        required : true
    },

    /**
     * Contact Phone
     */
    contact_phone : {
        type : String,
        required : true
    },

    /**
     * Billing Address
     */
    bill_address : {
        type : String,
        required : true
    },

    /**
     * Billing City
     */
    bill_city : {
        type : String,
        required : true
    },

    /**
     * Billing State
     */
    bill_state : {
        type : String,
        required : true
    },

    /**
     * Billing ZIP Code
     */
    bill_zip : {
        type : String,
        required : true
    },

    /**
     * Order Items
     */
    items : [OrderItemSchema],

    /**
     * Date of order
     */
    date : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('Order', OrderSchema);