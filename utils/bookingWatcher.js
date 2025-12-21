const Booking = require("../models/booking");

function startWatch() {
  console.log("⏱ Booking expiration watcher started");

  setInterval(async () => {
    try {
      const result = await Booking.updateMany(
        {
          status: "PENDING",
          expiresAt: { $lt: new Date() },
        },
        { status: "EXPIRED" }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `⌛ Expired ${result.modifiedCount} booking(s)`
        );
      }
    } catch (err) {
      console.error("Booking expiration error:", err);
    }
  }, 60 * 1000); // ⏱ every 1 minute
}

module.exports = startWatch;
