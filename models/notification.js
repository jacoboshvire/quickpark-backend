const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    // Who should see this notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Notification content
    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    // Extra data (used for navigation, deep links, etc.)
    data: {
      type: Object,
      default: {},
    },

    // Whether the user has opened it
    read: {
      type: Boolean,
      default: false,
    },

    // Optional: type/category
    type: {
      type: String,
      enum: ["SELLER", "SYSTEM", "PROMOTION"],
      default: "SYSTEM",
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);
