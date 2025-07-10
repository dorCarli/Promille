const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

admin.initializeApp();

const corsHandler = cors({ origin: "https://dorcarli.github.io" }); // nur deine Domain erlauben, oder origin: true für alle

exports.sendDrinkNotification = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send({ error: "Method not allowed" });
    }

    const name = req.body.name;
    if (!name) {
      return res.status(400).send({ error: "Name fehlt" });
    }

    try {
      const tokensSnapshot = await admin.database().ref('fcmTokens').once('value');
      const tokens = tokensSnapshot.val() ? Object.values(tokensSnapshot.val()) : [];

      if (tokens.length === 0) {
        return res.status(200).json({ message: "Keine registrierten Geräte gefunden." });
      }

      const message = {
        notification: {
          title: "Trinkbenachrichtigung",
          body: `${name} möchte trinken!`
        },
        tokens: tokens,
      };

      const response = await admin.messaging().sendMulticast(message);

      return res.status(200).json({
        message: `Nachricht von ${name} gesendet`,
        successCount: response.successCount,
        failureCount: response.failureCount
      });
    } catch (error) {
      console.error("Fehler beim Senden:", error);
      return res.status(500).send({ error: "Fehler beim Senden der Nachricht" });
    }
  });
});
