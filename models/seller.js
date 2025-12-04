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
    lat: Number,
    long: Number,
    duration: Number,
    date: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true   // MUST be a date
    }
});

// ⭐ ADD THIS → TTL auto-delete
Sellerschema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Seller", Sellerschema);
