importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD43TYRuIZxI1pS_noOzlKCIEzUm8Q7FiQ",
  authDomain: "promille-b4bd3.firebaseapp.com",
  projectId: "promille-b4bd3",
  storageBucket: "promille-b4bd3.firebasestorage.app",
  messagingSenderId: "627353030877",
  appId: "1:627353030877:web:18285915baa3744ebbcb34",
});

const messaging = firebase.messaging();
