/* Daily Tail Firebase background messaging: public FCM config only. */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:'AIzaSyCdtV1qU_JxApJv3YwJqadUurjdAsCph98',authDomain:'daily-tail.firebaseapp.com',projectId:'daily-tail',storageBucket:'daily-tail.firebasestorage.app',messagingSenderId:'789609946634',appId:'1:789609946634:web:5c116c9bb8bd5051ad89f3'});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
 if(payload.notification)return;
 const data=payload.data||{};
 return self.registration.showNotification(data.title||'Daily Tail reminder 🐾',{
  body:data.body||'An activity needs your attention.',
  icon:'./daily-tail-icon.svg',badge:'./daily-tail-icon.svg',tag:data.tag||'daily-tail-reminder',data:{url:data.url||'./'}
 });
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=new URL(event.notification.data?.url||'./',self.registration.scope).href;
 event.waitUntil((async()=>{
  const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of clientsList){if(client.url.startsWith(self.registration.scope)&&'focus' in client){await client.focus();return;}}
  if(clients.openWindow)await clients.openWindow(url);
 })());
});