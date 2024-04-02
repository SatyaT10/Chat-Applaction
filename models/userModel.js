const mongoose = require('mongoose');


const userSchema =  mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    image: {
        type: String
    },
    is_online: {
        type:String,
        default: '0'
    }
},
    { timestamps: true }

);


module.exports = mongoose.model("User", userSchema);