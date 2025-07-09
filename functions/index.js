const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

exports.sendDrinkNotification = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(405).send({ error: "Method not allowed" });
    }

    const name = req.body.name;
    if (!name) {
      return res.status(400).send({ error: "Name fehlt" });
    }

    // Hier kannst du deine Push-Logik einfügen.
    // Beispiel: console.log("Sende Nachricht von:", name);

    return res.status(200).json({ message: `Nachricht von ${name} gesendet` });
  });
});
