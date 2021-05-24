var mongoose = require('mongoose');
var uuid = require('uuid');

const userSchema = new mongoose.Schema({
    user_id: { 
        type: String, 
        default: uuid.v1 
    },
    name: {
        type:String
    },
    email:{
        type:String
    },
    mobile:{
        type:String
    },
    state:{
        type:Number
    },
    age:{
        type:String
    },
    district:{
        type:Number
    },
    fee_type:{
        type:String
    },
    vname:{
        type:String
    },
    dose_type:{
        type:String
    }
});
module.exports = mongoose.model('User',userSchema);