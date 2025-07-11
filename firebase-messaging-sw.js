importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  projectId: "promille-b4bd3",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:218cd951414fe996bbcb34"
});

const messaging = firebase.messaging();
