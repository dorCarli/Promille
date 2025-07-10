const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendDrinkNotification = functions.https.onRequest(async (req, res) => {
  // CORS-Handling (OPTIONS Preflight)
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*'); // Domain einschränken für Produktion!
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }
  
  res.set('Access-Control-Allow-Origin', '*'); // Domain einschränken für Produktion!

  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  const name = req.body.name;
  if (!name) {
    return res.status(400).send({ error: 'Name fehlt' });
  }

  try {
    const tokensSnapshot = await admin.database().ref('fcmTokens').once('value');
    const rawTokensObj = tokensSnapshot.val();

    const tokens = rawTokensObj
      ? Object.values(rawTokensObj).map(t => t.trim()).filter(t => t.length > 0)
      : [];

    if (tokens.length === 0) {
      return res.status(200).json({ message: "Keine registrierten Geräte gefunden." });
    }

    const payload = {
      notification: {
        title: "Trinkbenachrichtigung",
        body: `${name} möchte trinken!`,
      }
    };

    const response = await admin.messaging().sendToDevice(tokens, payload);

    // Ungültige Tokens aus der DB entfernen (optional)
    response.results.forEach((result, index) => {
      if (result.error) {
        const failedToken = tokens[index];
        const userEntry = Object.entries(rawTokensObj).find(([_, val]) => val.trim() === failedToken);
        if (userEntry) {
          const userKey = userEntry[0];
          admin.database().ref(`fcmTokens/${userKey}`).remove();
        }
      }
    });

    return res.status(200).json({
      message: `Nachricht von ${name} gesendet`,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

  } catch (error) {
    console.error("Fehler beim Senden:", error);
    return res.status(500).json({ error: "Fehler beim Senden der Nachricht", detail: error.message });
  }
});
