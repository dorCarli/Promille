const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendDrinkNotification = functions.https.onRequest(async (req, res) => {
  const name = req.body.name || "Jemand";

  const payload = {
    notification: {
      title: `${name} möchte trinken!`,
      body: "Zeit für eine Runde?",
      click_action: "https://promille-b4bd3.web.app"
    }
  };

  try {
    await admin.messaging().sendToTopic("all", payload);
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Fehler beim Senden:", error);
    res.status(500).send({ success: false, error: error.toString() });
  }
});
