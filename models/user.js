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
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    dateCreated: {
      type: Date,
      default: Date.now
    },
    avatar: {
      type: String,
      default: "https://res.cloudinary.com/dr0yyqvj6/image/upload/v1765055574/avatar_l6mc3s.png"
    },
    fcmTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }

);

module.exports = mongoose.model("User", UserSchema);
