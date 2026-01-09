const express = require("express");
const User = require("../models/user");
const Notification = require("../models/notification");
const sendNotification = require("../utils/sendNotification");
const { auth, isAdmin } = require("../middleware/auth");
// optional

const router = express.Router();

/**
 * POST /api/admin/notifications/send
 */
router.post("/send", auth, isAdmin, async (req, res) => {
  const { title, body, target } = req.body;

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required" });
  }

  // 1️⃣ Select users
  let users;
  if (target === "ALL") {
    users = await User.find({});
  } else {
    users = await User.find({ role: target }); // e.g. SELLER / BUYER
  }

  // 2️⃣ Save notification history
  await Notification.insertMany(
    users.map((u) => ({
      user: u._id,
      title,
      body,
      type: "SYSTEM",
    }))
  );

  // 3️⃣ Collect FCM tokens
  const tokens = users
    .flatMap((u) => u.fcmTokens || [])
    .filter(Boolean);

  // 4️⃣ Send push
  if (tokens.length > 0) {
    await sendNotification(tokens, title, body);
  }

  res.json({ message: "Notification sent successfully" });
});

module.exports = router;
