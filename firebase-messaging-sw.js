importScripts('https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.x.x/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "DEIN_API_KEY",
  authDomain: "DEINE_DOMAIN.firebaseapp.com",
  projectId: "DEIN_PROJECT_ID",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID",
});

const messaging = firebase.messaging();

// Push-Nachrichten-Empfang im Hintergrund:
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Empfangene Nachricht im Hintergrund:', payload);
  // Hier Notification anzeigen, z.B.:
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
