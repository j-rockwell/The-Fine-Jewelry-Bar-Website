const mongoose = require('mongoose');

const DesignerSchema = new mongoose.Schema({
    /**
     * Name of the designer
     * This is used on all displays and search queries
     */
    name : {
        type : String,
        required : true
    }
});

module.exports = mongoose.model('Designer', DesignerSchema);