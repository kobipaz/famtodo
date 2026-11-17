/* Push notifications (Firebase Cloud Messaging). The phone opts in once from the profile panel;
   the notification sender runs on GitHub Actions (scripts/notify.py). */
var PUSH = { state: 'idle', msg: '' };
var FB_V = '10.14.1', FB_BASE = 'https://www.gstatic.com/firebasejs/' + FB_V + '/';
function pushSupported() { return !!(CFG && CFG.firebase && CFG.vapidKey && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window); }
function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
function pushRegister(interactive) {
  if (!pushSupported() || !st.me || store.mode !== 'cloud') return Promise.resolve(false);
  var perm = interactive ? Notification.requestPermission() : Promise.resolve(Notification.permission);
  return perm.then(function (p) {
    if (p !== 'granted') { PUSH.state = p === 'denied' ? 'denied' : 'idle'; return false; }
    return navigator.serviceWorker.register('firebase-messaging-sw.js').then(function (reg) {
      return Promise.all([import(FB_BASE + 'firebase-app.js'), import(FB_BASE + 'firebase-messaging.js'), import(FB_BASE + 'firebase-firestore.js')]).then(function (m) {
        var app = m[0].getApp(), M = m[1], F = m[2];
        var messaging = M.getMessaging(app);
        if (!PUSH.listening) { PUSH.listening = true; M.onMessage(messaging, function (pl) { var n = pl.notification || {}; toast('🔔 ' + (n.title || '') + (n.body ? ' — ' + n.body : '')); }); }
        return M.getToken(messaging, { vapidKey: CFG.vapidKey, serviceWorkerRegistration: reg }).then(function (tok) {
          if (!tok) return false;
          LS.set('pushToken', tok);
          return F.setDoc(F.doc(F.getFirestore(app), 'tokens', tok), { person: st.me.id, updatedAt: Date.now(), ios: isIOS() }).then(function () { PUSH.state = 'on'; return true; });
        });
      });
    });
  }).catch(function (e) { console.error(e); PUSH.state = 'error'; PUSH.msg = e && (e.code || e.message); return false; });
}
/* keep the token fresh on every start (tokens can rotate) */
var _startMainP = startMain;
startMain = function (person) { _startMainP(person); if (window.Notification && Notification.permission === 'granted') setTimeout(function () { pushRegister(false); }, 2500); };
if (st.me && window.Notification && Notification.permission === 'granted') setTimeout(function () { pushRegister(false); }, 2500);
/* profile panel: notification section */
var _renderPanelP = renderPanel;
renderPanel = function () {
  _renderPanelP();
  var p = document.querySelector('#sheet .panel'); if (!p || !st.panel || st.pick || st.topicSheet) return;
  var h = '<div class="setrow col"><div class="sr-h">🔔 התראות</div>';
  if (store.mode !== 'cloud') h += '<div class="sr-t">התראות פועלות רק באפליקציה האמיתית (לא בהדגמה).</div>';
  else if (isIOS() && !isStandalone()) h += '<div class="sr-t">באייפון ההתראות עובדות רק מהאפליקציה שבמסך הבית: בספארי לוחצים שיתוף ⬆️ ← "הוספה למסך הבית", ופותחים משם.</div>';
  else if (!pushSupported()) h += '<div class="sr-t">הדפדפן הזה לא תומך בהתראות.</div>';
  else if (Notification.permission === 'denied' || PUSH.state === 'denied') h += '<div class="sr-t">ההתראות חסומות. אפשר לאשר אותן בהגדרות הטלפון ← התראות.</div>';
  else if (Notification.permission === 'granted' && (PUSH.state === 'on' || LS.get('pushToken'))) h += '<div class="sr-t">✅ פעילות במכשיר הזה: משימה חדשה בשבילך, תזכורת בוקר ותזכורת אחרי בית הספר.</div>';
  else h += '<div class="sr-t">קבלו התראה כשמוסיפים לכם משימה, ותזכורות בבוקר ואחרי בית הספר.</div><button class="btn" data-push-on="1" style="width:100%;margin-top:8px">' + (PUSH.state === 'busy' ? 'מפעיל…' : 'הפעלת התראות') + '</button>';
  if (PUSH.state === 'error') h += '<div class="sr-t" style="color:var(--danger)">משהו השתבש: ' + esc(PUSH.msg || '') + '</div>';
  h += '</div>';
  var acts = p.querySelector('.actions:last-of-type');
  if (acts) acts.insertAdjacentHTML('beforebegin', h); else p.insertAdjacentHTML('beforeend', h);
};
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-push-on]'); if (!b) return;
  PUSH.state = 'busy'; renderPanel();
  pushRegister(true).then(function (ok) { if (ok) toast('🔔 ההתראות הופעלו'); renderPanel(); });
});
