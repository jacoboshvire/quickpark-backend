const admin = require("./firebase");

async function sendNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  const message = {
    tokens,
    notification: { title, body },
    data,
  };

  try {
    await admin.messaging().sendMulticast(message);
  } catch (err) {
    console.error("FCM Error:", err);
  }
}

module.exports = sendNotification;
