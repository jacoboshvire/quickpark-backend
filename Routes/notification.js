const express = require("express");
const Notification = require("../models/notification");
const {auth, isAdmin} = require("../middleware/auth");

const router = express.Router();

// Get notifications
router.get("/", auth, async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notifications);
});

// Mark as read
router.put("/:id/read", auth, async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true }
  );

  res.json({ message: "Marked as read" });
});

// Unread count
router.get("/unread-count", auth, async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    read: false,
  });

  res.json({ count });
});

// DELETE /api/notifications/:id
router.delete("/:id", auth, async (req, res) => {
  await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  res.json({ message: "Notification deleted" });
});


module.exports = router;
