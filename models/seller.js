const mongoose = require("mongoose");

const Sellerschema = new mongoose.Schema({
    location: String,
    postalcode: String,
    phonenumber: String,
    price: Number,
    sortcode: String,
    accountnumber: String,
    accountname: String,
    image: String,
    imagewidth: Number,
    imageheight: Number,
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Seller", Sellerschema)