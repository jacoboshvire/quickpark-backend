const admin = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { cert } = require("firebase-admin/app");

const serviceAccount = require(process.env.FIREBASE_URL);

admin.initializeApp({
  credential: cert(serviceAccount),
});

module.exports = { admin, getMessaging };

