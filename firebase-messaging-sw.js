importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  databaseURL: "https://promille-b4bd3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "promille-b4bd3",
  storageBucket: "promille-b4bd3.firebasestorage.app",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:218cd951414fe996bbcb34",
  measurementId: "G-3L9ZRZBREV"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});