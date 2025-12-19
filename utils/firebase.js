const admin = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { cert } = require("firebase-admin/app");

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Production
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8")
  );
} else {
  // Local development
  serviceAccount = require(FIREBASE_URL);
}


admin.initializeApp({
  credential: cert(serviceAccount),
});

module.exports = { admin, getMessaging };


