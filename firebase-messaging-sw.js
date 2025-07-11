importScripts('https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.x.x/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  projectId: "promille-b4bd3",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:18285915baa3744ebbcb34",
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
