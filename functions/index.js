const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

admin.initializeApp();

const corsHandler = cors({
  origin: "https://dorcarli.github.io", // Erlaube deine Web-App-URL hier
});

// Hilfsfunktion zum Bereinigen eines Tokens
function cleanToken(token) {
  return token.trim().replace(/^'+|'+$/g, '');
}

exports.sendDrinkNotification = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
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
      console.log("⏳ Lese Tokens aus Datenbank…");
      const tokensSnapshot = await admin.database().ref('fcmTokens').once('value');
      const rawTokens = tokensSnapshot.val();
      console.log("📦 Rohdaten aus DB:", rawTokens);

      const tokens = rawTokens
        ? Object.values(rawTokens).map(cleanToken).filter(t => t.length > 0)
        : [];

      if (tokens.length === 0) {
        console.log("⚠️ Keine Tokens gefunden.");
        return res.status(200).json({ message: "Keine registrierten Geräte gefunden." });
      }

      console.log("📲 Sende Push an bereinigte Tokens:", tokens);

      const payload = {
        notification: {
          title: "Trinkbenachrichtigung",
          body: `${name} möchte trinken!`,
        },
      };

      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log("✅ Antwort von FCM:", response);

      return res.status(200).json({
        message: `Nachricht von ${name} gesendet`,
        successCount: response.successCount || 0,
        failureCount: response.failureCount || 0
      });
    } catch (error) {
      console.error("❌ Fehler beim Senden:", error);
      return res.status(500).send({ error: "Fehler beim Senden der Nachricht", detail: error.message });
    }
  });
});
