const mongoose = require("mongoose");

const Sellerschema = new mongoose.Schema({
    //Link seller post to logged-in user
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    locations: String,
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
    timeNeeded: String,
    date: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true   // MUST be a date
    }
});

// ADD THIS → TTL auto-delete
Sellerschema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Seller", Sellerschema);
