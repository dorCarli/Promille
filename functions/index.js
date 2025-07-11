const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendDrinkNotification = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  const name = req.body.name;
  const senderToken = req.body.token;

  if (!name || !senderToken) {
    return res.status(400).send({ error: 'Name oder Token fehlt' });
  }

  const payload = {
    notification: {
      title: "Trinkbenachrichtigung",
      body: `${name} möchte trinken!`,
    }
  };

  try {
    const snapshot = await admin.database().ref("fcmTokens").once("value");
    const tokensObj = snapshot.val() || {};

    const allTokens = Object.values(tokensObj);
    const targetTokens = allTokens.filter(token => token !== senderToken);

    if (targetTokens.length === 0) {
      return res.status(200).json({ message: "Niemand außer dem Sender ist registriert." });
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens: targetTokens,
      notification: payload.notification,
    });

    console.log("✅ Nachricht gesendet an", targetTokens.length, "Geräte");
    return res.status(200).json({ message: `Nachricht von ${name} gesendet`, successCount: response.successCount });

  } catch (error) {
    console.error("❌ Fehler beim Senden:", error);
    return res.status(500).json({ error: "Fehler beim Senden der Nachricht", detail: error.message });
  }
});
