const express = require("express")
const auth = require("../middleware/auth.js");

// setting router to router
const router = express.Router()

//make express know i'm using router
router.use(express.json());

router.get("/notifications", auth, async (req, res) => {
  const notifications = await Notification.find({
    user: req.user.id,
  })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notifications);
});

router.put("/notifications/:id/read", auth, async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true }
  );

  res.json({ message: "Notification marked as read" });
});



// exporting router
module.exports = router