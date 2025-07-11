importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  projectId: "promille-b4bd3",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:218cd951414fe996bbcb34"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('🔕 [Service Worker] Hintergrundnachricht erhalten:', payload);

  const notificationTitle = payload.notification?.title || 'Benachrichtigung';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/images/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
