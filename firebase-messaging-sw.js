/* FamToDo service worker: shows push notifications sent by scripts/notify.py */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
importScripts('config.js');
firebase.initializeApp(self.FAMTODO_CONFIG.firebase);
firebase.messaging();
