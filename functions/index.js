const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Service Account JSON laden (im gleichen Ordner)
const serviceAccount = require("./promille-b4bd3-firebase-adminsdk-fbsvc-a5317bf1e4.json");

// Firebase Admin SDK mit Service Account initialisieren und Realtime Database URL angeben
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://promille-b4bd3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "promille-b4bd3" // <- explizit hinzufügen
});

const corsHandler = cors({
  origin: "https://dorcarli.github.io", // Deine Web-App-Domain
});

// Hilfsfunktion zum Bereinigen eines Tokens
function cleanToken(token) {
  return token.trim().replace(/^['"\s]+|['"\s]+$/g, ''); // Entfernt ', ", und Leerzeichen
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
      const rawTokensObj = tokensSnapshot.val();
      console.log("📦 Rohdaten aus DB:", rawTokensObj);

      const tokens = rawTokensObj
        ? Object.values(rawTokensObj).map(cleanToken).filter(t => t.length > 0)
        : [];

      if (tokens.length === 0) {
        console.log("⚠️ Keine Tokens gefunden.");
        return res.status(200).json({ message: "Keine registrierten Geräte gefunden." });
      }

      console.log("📲 Sende Push an Tokens:", tokens);

      const payload = {
        notification: {
          title: "Trinkbenachrichtigung",
          body: `${name} möchte trinken!`,
        },
      };

      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log("✅ Antwort von FCM:", response);

      const failedTokens = [];

      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          const failedToken = tokens[index];
          console.error(`❌ Fehler beim Senden an ${failedToken}:`, error.message);
          failedTokens.push(failedToken);

          const userEntry = Object.entries(rawTokensObj).find(([_, val]) => cleanToken(val) === failedToken);
          if (userEntry) {
            const userKey = userEntry[0];
            console.log(`🧹 Entferne ungültigen Token für ${userKey}`);
            admin.database().ref(`fcmTokens/${userKey}`).remove();
          }
        }
      });

      return res.status(200).json({
        message: `Nachricht von ${name} gesendet`,
        successCount: response.successCount || 0,
        failureCount: response.failureCount || 0,
        failedTokens
      });

    } catch (error) {
      console.error("❌ Fehler beim Senden:", error);
      return res.status(500).send({ error: "Fehler beim Senden der Nachricht", detail: error.message });
    }
  });
});
