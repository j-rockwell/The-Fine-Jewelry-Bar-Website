const mongoose = require('mongoose');
const ListingOptionSchema = require('./listing-option').schema;

const ListingSchema = new mongoose.Schema({
    /**
     * Listing Name
     */
    name : {
        type : String,
        required : true
    },

    /**
     * Description
     */
    description : {
        type : String,
        required : false
    },

    /**
     * Designer
     */
    designer : {
        type : String,
        required : true
    },

    /**
     * Jewelry Type
     * Supports 'ring', 'necklace', 'earring' and 'bracelet'
     */
    type : {
        type : String,
        required : true
    },

    /**
     * Jewelry Collection
     * This value is used to show 'similar items'
     */
    coll : {
        type : String,
        required : false
    },

    /**
     * Collection of listing options
     */
    options : [ListingOptionSchema],

    /**
     * Featured
     * If true, item will be shown at the top of all search displays
     */
    featured : {
        type : Boolean,
        default : false
    },

    /**
     * Listing priority
     * Lower priority will show closer to the top
     */
    priority : {
        type : Number,
        required : false
    },

    /**
     * Date of creation
     */
    date : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('Listing', ListingSchema);