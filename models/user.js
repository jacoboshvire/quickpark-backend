const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true, // remove extra spaces
    },
    email: {
      type: String,
      required: true,
      unique: true, // prevent duplicate accounts
      lowercase: true, // normalize emails
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    dateCreated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("User", UserSchema);
