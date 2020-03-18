const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
    code : {
        type : String,
        required : true
    },

    minCartValue : {
        type : Number,
        required : false
    },

    percentDiscounted : {
        type : Number,
        required : true
    },

    dollarDiscounted : {
        type : Number,
        required : true
    },

    remainingUses : {
        type : Number,
        required : false
    },

    created : {
        type : Date,
        default : Date.now()
    },

    expire : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('PromoCode', PromoCodeSchema);