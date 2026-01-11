const express = require("express");
const Seller = require("../models/seller");
const Booking = require("../models/bookings");
const Notification = require("../models/notification");
const {auth} = require("../middleware/auth");

const router = express.Router();

/* =========================
   GET BOOKING BY ID
========================= */
router.get("/booking/:id", auth, async (req, res) => {
  try {
    const bookingId = req.params.id;

    // 1️Validate ObjectId
    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    // 2Find booking
    const booking = await Booking.findById(bookingId)
      .populate("sellerPost")
      .populate("buyer", "fullname email")
      .populate("seller", "fullname email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 3️Authorization: buyer or seller only
    const userId = req.user.id;
    if (
      booking.buyer.toString() !== userId &&
      booking.seller.toString() !== userId
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 4️Success
    res.json(booking);
  } catch (err) {
    console.error("GET BOOKING BY ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   CREATE BOOKING (PENDING)
========================= */
router.post("/book/:sellerId", auth, async (req, res) => {
  try {
    const sellerPost = await Seller.findById(req.params.sellerId);

    if (!sellerPost) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (sellerPost.user.toString() === req.user.id) {
      return res.status(400).json({ message: "Cannot book your own listing" });
    }

    const existing = await Booking.findOne({
      sellerPost: sellerPost._id,
      status: { $in: ["PENDING", "CONFIRMED"] },
    });

    if (existing) {
      return res.status(409).json({ message: "Already booked" });
    }

    const booking = await Booking.create({
      sellerPost: sellerPost._id,
      buyer: req.user.id,
      seller: sellerPost.user,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await Notification.create({
      user: sellerPost.user,
      title: "New Booking Request",
      body: "Someone wants to book your parking space",
      data: { bookingId: booking._id },
      type: "SYSTEM",
    });

    res.status(201).json({
      message: "Booking request sent",
      booking,
    });
  } catch (err) {
    console.error("BOOKING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ACCEPT BOOKING (DELETE POST)
========================= */
router.put("/booking/:id/accept", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({ message: "Booking already processed" });
    }

    booking.status = "CONFIRMED";
    await booking.save();

    await Seller.findByIdAndDelete(booking.sellerPost);

    await Booking.updateMany(
      {
        sellerPost: booking.sellerPost,
        status: "PENDING",
        _id: { $ne: booking._id },
      },
      { status: "REJECTED" }
    );

    await Notification.create({
      user: booking.buyer,
      title: "Booking Confirmed ✅",
      body: "Your booking has been accepted",
      data: { bookingId: booking._id },
      type: "SYSTEM",
    });

    res.json({ message: "Booking confirmed and post deleted" });
  } catch (err) {
    console.error("ACCEPT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   REJECT BOOKING
========================= */
router.put("/booking/:id/reject", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({ message: "Booking already processed" });
    }

    booking.status = "REJECTED";
    await booking.save();

    await Notification.create({
      user: booking.buyer,
      title: "Booking Rejected ",
      body: "Your booking request was rejected",
      data: { bookingId: booking._id },
      type: "SYSTEM",
    });

    res.json({ message: "Booking rejected" });
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
