const mongoose = require('mongoose');
const CartItemSchema = require('./cart-item').schema;

const UserSchema = new mongoose.Schema({
    firstName : {
        type : String,
        required : true
    },

    lastName : {
        type : String,
        required : true
    },

    email : {
        type : String,
        required : true
    },

    password : {
        type : String,
        required : true,
    },

    newsletter : {
        type : Boolean,
        default : true
    },

    cart : [CartItemSchema],

    admin : {
        type: Boolean,
        default : false
    },

    dateCreated : {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('User', UserSchema);