import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  projectId: "promille-b4bd3",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:218cd951414fe996bbcb34",
  databaseURL: "https://promille-b4bd3-default-rtdb.europe-west1.firebasedatabase.app"
};

// App initialisieren
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// 🔑 VAPID Key
const VAPID_KEY = "BLXKIJi31DHoEr083zJkotuGDcPQFmBiM5KHwXHahGpIbcLliw0pyEinaPbIg64gaM2KxIZhwH0JTxis4RDDfZs";

// Token holen
Notification.requestPermission().then((permission) => {
  if (permission === "granted") {
    return getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: navigator.serviceWorker
    });
  } else {
    throw new Error("Benachrichtigungen nicht erlaubt.");
  }
})
.then((currentToken) => {
  console.log("✅ Token erhalten:", currentToken);

  const user = JSON.parse(localStorage.getItem("userData") || "{}");
  if (!user.username) return;

  function sanitizeKey(key) {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  const db = getDatabase(app);
  const tokenRef = ref(db, 'fcmTokens/' + sanitizeKey(user.username));
  set(tokenRef, currentToken);
})
.catch((err) => {
  console.error("❌ Fehler beim Token holen:", err);
});

// Nachricht im Vordergrund empfangen
onMessage(messaging, (payload) => {
  console.log("🔔 Nachricht im Vordergrund:", payload);

  const title = payload.notification?.title || "Neue Nachricht";
  const body = payload.notification?.body || "";

  new Notification(title, { body });
});
