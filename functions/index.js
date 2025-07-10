const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

admin.initializeApp();

const corsHandler = cors({
  origin: "https://dorcarli.github.io", // oder origin: true, um alle Domains zu erlauben
});

// Die Cloud Function mit CORS-Handling
exports.sendDrinkNotification = functions.https.onRequest((req, res) => {
  // CORS Middleware aufrufen
  corsHandler(req, res, async () => {
    // Preflight-Anfrage direkt beantworten
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(204).send('');
    }

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
