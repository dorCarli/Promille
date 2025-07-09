const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendGlobalPush = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await admin.database().ref("tokens").once("value");
    const tokensObj = snapshot.val();

    if (!tokensObj) {
      return res.status(200).send("Keine Tokens gefunden.");
    }

    const tokens = Object.values(tokensObj).map(entry => entry.token).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(200).send("Keine gültigen Tokens gefunden.");
    }

    const name = (req.body && req.body.name) || "Jemand";

    const message = {
      notification: {
        title: "🍻 Cheers!",
        body: `${name} lädt zum Trinken ein.`
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);

    res.status(200).send(`Benachrichtigung gesendet an ${response.successCount} Nutzer`);
  } catch (error) {
    console.error("Fehler beim Senden:", error);
    res.status(500).send("Fehler beim Senden der Push-Nachricht");
  }
});
