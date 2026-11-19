/* 🎉 אירועים משפחתיים — family events (bat mitzvah, festival, weddings…) with a countdown, in their own window
   (☰ → קבוצות → אירועים משפחתיים / home tile). Stored as items in the "family" list with event:true, title,
   due ('YYYY-MM-DD' or ''), time, place, details. Kept out of the task lists. Everyone sees them; Kobi & Orit add / edit / delete. */
var EVT = { id: 'events', name: 'אירועים משפחתיים', color: '#86198f', icon: '🎉' };
L.events = EVT;
var EV_SEED = ['בת מצווה לאביב', 'פסטיגל', 'סופ״ש בים המלח', 'סופ״ש באילת'];
var EV_PRESETS = ['בת מצווה', 'בר מצווה', 'חתונה', 'ברית', 'יום הולדת', 'פסטיגל', 'הופעה', 'טיול משפחתי', 'סופ״ש', 'ארוחת חג'];
st.events = []; st.evForm = null; st.evPast = false;
function evAdmin() { return st.me && (st.me.id === 'kobi' || st.me.id === 'orit'); }
function evUp() { return st.events.filter(function (e) { return !e.due || dayDiff(e.due) >= 0; }).sort(function (a, b) { return (a.due || '9').localeCompare(b.due || '9') || a.title.localeCompare(b.title, 'he'); }); }
function patchStoreEv() {
  if (!store || store._evPatched) return;
  store._evPatched = true;
  var sub = store.subscribeTasks;
  store.subscribeTasks = function (lists, cb, err) {
    return sub.call(store, lists, function (tasks) {
      var seen = {}; st.events = tasks.filter(function (t) { if (!t.event) return false; var k = t.title + '|' + (t.due || ''); if (seen[k]) return false; seen[k] = 1; return true; });
      cb(tasks.filter(function (t) { return !t.event; }));
      evSeed();
      if (st.active === 'events' || st.active === 'home') renderList();
    }, err);
  };
}
var _startMainEV = startMain;
startMain = function (p) { patchStoreEv(); _startMainEV(p); };
if (st.me) startMain(st.me.id);
function evSeed() {
  if (!st.me || st.me.id !== 'kobi' || !st.loaded || +(LS.get('evSeedV') || 0) >= EV_SEED.length) return;
  LS.set('evSeedV', String(EV_SEED.length));
  var have = {}; st.events.forEach(function (e) { have[e.title] = 1; });
  EV_SEED.forEach(function (t, i) {
    if (have[t]) return;
    store.add({ event: true, title: t, due: '', time: '', place: '', details: '', list: 'family', topic: '', done: false,
                createdBy: 'kobi', createdAt: Date.now() + i, doneBy: '', doneAt: 0, notes: [] }).catch(fail);
  });
}
var _renderChipsEV = renderChips;
renderChips = function () {
  _renderChipsEV();
  if (!st.drawer || !st.me) return;
  var grp = null; document.querySelectorAll('#drawer .dsec').forEach(function (s) { if (s.textContent === 'קבוצות') grp = s; });
  if (!grp) return;
  var n = grp.nextElementSibling; while (n && n.classList.contains('drow')) n = n.nextElementSibling;
  var tmp = document.createElement('div'); tmp.innerHTML = listRow(EVT, evUp().filter(function (e) { return e.due && dayDiff(e.due) <= 14; }).length);
  grp.parentNode.insertBefore(tmp.firstChild, n);
};
function evRow(e) {
  var lf = e.due ? exLeft(e.due) : { t: 'עוד אין תאריך', c: 'nodate' };
  var when = e.due ? exFmt(e.due) + (e.time ? ' · ' + e.time : '') : (evAdmin() ? 'לחצו להוספת תאריך' : '');
  return '<button class="exrow evrow ' + lf.c + '" data-ev="' + e.id + '" style="--kc:' + EVT.color + '">' +
    '<span class="exsub">🎉 ' + esc(e.title) + '</span><span class="exleft">' + lf.t + '</span>' +
    '<span class="exdate">' + when + (e.place ? ' · 📍 ' + esc(e.place) : '') + '</span>' +
    (e.details ? '<span class="exnote">📓 ' + esc(e.details.split('\n')[0].slice(0, 60)) + '</span>' : '') + '</button>';
}
var _renderListEV = renderList;
renderList = function () {
  if (st.active !== 'events') return _renderListEV.apply(this, arguments);
  var el = document.getElementById('list'); if (!el) return;
  var af = document.getElementById('addform'); if (af) af.style.display = 'none';
  evSeed();
  var up = evUp(), past = st.events.filter(function (e) { return e.due && dayDiff(e.due) < 0; }).sort(function (a, b) { return b.due.localeCompare(a.due); });
  var h = '<div class="listhead"><div class="lh"><h1>🎉 אירועים משפחתיים</h1></div>' +
    (up.length ? '<span class="exout"><button type="button" class="exoutb" data-ev-share="1" aria-label="שיתוף">' + (typeof NB_SHARE_SVG !== 'undefined' ? NB_SHARE_SVG : '📤') + '</button></span>' : '') +
    (evAdmin() ? '<button class="btn exadd" data-ev="new">+ אירוע</button>' : '') + '</div>';
  if (!up.length) h += '<div class="empty"><div class="big">🎉</div>אין אירועים קרובים.' + (evAdmin() ? '<br>לוחצים על "+ אירוע".' : '') + '</div>';
  h += up.map(evRow).join('');
  if (past.length) {
    h += '<button class="exshowpast" data-ev="past">' + (st.evPast ? '▾' : '◂') + ' אירועים שעברו (' + past.length + ')</button>';
    if (st.evPast) h += past.map(evRow).join('');
  }
  el.innerHTML = h;
};
function evShare() {
  var up = evUp(); if (!up.length) return;
  var text = '*🎉 אירועים משפחתיים*\n\n' + up.map(function (e) {
    return '*' + e.title + '*' + (e.due ? '\n' + exFmt(e.due) + (e.time ? ' · ' + e.time : '') + ' · ' + exLeft(e.due).t : '\nתאריך יעודכן') + (e.place ? '\n📍 ' + e.place : '');
  }).join('\n\n');
  if (navigator.share) navigator.share({ text: text }).catch(function (x) { if (x && x.name !== 'AbortError') nbCopy(text); });
  else nbCopy(text);
}
function evOpen(id) {
  if (!evAdmin()) return;
  var e = id && id !== 'new' ? st.events.filter(function (x) { return x.id === id; })[0] : null;
  st.evForm = { id: e ? e.id : null, title: e ? e.title : '', due: e ? (e.due || '') : '', time: e ? (e.time || '') : '', place: e ? (e.place || '') : '', details: e ? (e.details || '') : '' };
  evDraw();
}
function evDraw() {
  var f = st.evForm, w = document.getElementById('evwin');
  if (!f) { if (w) w.remove(); document.documentElement.classList.remove('nbopen'); return; }
  if (!w) { w = document.createElement('div'); w.id = 'evwin'; w.className = 'exwinlike'; document.body.appendChild(w); }
  document.documentElement.classList.add('nbopen');
  w.innerHTML = '<div class="nbback" data-ev-x="1"></div><div class="nbcard excard" role="dialog">' +
    '<div class="nbhead"><span class="nbic">🎉</span><span class="nbtitle">' + (f.id ? 'עריכת אירוע' : 'אירוע חדש') + '</span><button type="button" class="nbclose" data-ev-x="1">✕</button></div>' +
    '<div class="exlbl">מה</div><input class="inp" id="evtitle" maxlength="80" placeholder="לדוגמה: בת מצווה לאביב" value="' + esc(f.title) + '">' +
    '<div class="exsubs">' + EV_PRESETS.map(function (p) { return '<button type="button" data-ev-pre="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') + '</div>' +
    '<div class="exlbl">תאריך</div><label class="exdatein"><input type="date" id="evdue" value="' + esc(f.due) + '"><span>' + (f.due ? exFmt(f.due) : 'עוד אין תאריך') + '</span></label>' +
    '<div class="exlbl">שעה <small>(לא חובה)</small></div><label class="exdatein"><input type="time" id="evtime" value="' + esc(f.time) + '"><span>' + (f.time || 'בלי שעה') + '</span></label>' +
    '<div class="exlbl">מקום <small>(לא חובה)</small></div><input class="inp" id="evplace" maxlength="80" value="' + esc(f.place) + '">' +
    '<div class="exlbl">פרטים <small>(לא חובה)</small></div><textarea id="exdet" class="evdet" maxlength="2000" placeholder="מה להביא, מי מגיע, הזמנות…">' + esc(f.details) + '</textarea>' +
    '<div class="nbact"><button type="button" class="btn" data-ev-save="1">שמירה</button><button type="button" class="btn soft" data-ev-x="1">ביטול</button>' +
    (f.id ? '<button type="button" class="btn danger ' + (st.sure === 'ev-' + f.id ? 'sure' : '') + '" data-ev-del="1">' + (st.sure === 'ev-' + f.id ? 'בטוח?' : '🗑') + '</button>' : '') + '</div></div>';
}
function evGrab() {
  var f = st.evForm; if (!f) return;
  f.title = document.getElementById('evtitle').value; f.due = document.getElementById('evdue').value;
  f.time = document.getElementById('evtime').value; f.place = document.getElementById('evplace').value;
  f.details = document.querySelector('#evwin textarea').value;
}
function evSave() {
  evGrab(); var f = st.evForm, title = clean(f.title, 80);
  if (!title) return toast('כותבים מה האירוע ✏️');
  var data = { event: true, title: title, due: f.due || '', time: f.due ? (f.time || '') : '', place: clean(f.place || '', 80) || '',
               details: String(f.details || '').replace(/\s+$/, '').slice(0, 2000) };
  var id = f.id; st.evForm = null; evDraw();
  var p = id ? store.update(id, data) : store.add(Object.assign(data, { list: 'family', topic: '', done: false, createdBy: st.me.id, createdAt: Date.now(), doneBy: '', doneAt: 0, notes: [] }));
  p.then(function () { toast('🎉 ' + title + (data.due ? ' · ' + exFmt(data.due) : '')); }).catch(fail);
}
document.addEventListener('click', function (e) {
  var t = e.target, b;
  if (st.active === 'events') {
    if (t.closest('[data-ev-share]')) { e.stopPropagation(); return evShare(); }
    if ((b = t.closest('[data-ev]'))) { var v = b.getAttribute('data-ev'); if (v === 'past') { st.evPast = !st.evPast; return renderList(); } return evOpen(v); }
  }
  if (!st.evForm) return;
  if ((b = t.closest('[data-ev-pre]'))) { var i = document.getElementById('evtitle'); i.value = b.getAttribute('data-ev-pre'); i.focus(); return; }
  if (t.closest('[data-ev-save]')) return evSave();
  if (t.closest('[data-ev-del]')) {
    var id = st.evForm.id;
    if (st.sure !== 'ev-' + id) { evGrab(); st.sure = 'ev-' + id; return evDraw(); }
    st.sure = null; st.evForm = null; evDraw();
    return store.remove(id).then(function () { toast('🗑 האירוע נמחק'); }).catch(fail);
  }
  if (t.closest('[data-ev-x]')) { st.evForm = null; st.sure = null; return evDraw(); }
}, true);
/* pickers: update only the label (redrawing would close the phone's picker) */
function evPick(e) {
  if (!st.evForm || !e.target || (e.target.id !== 'evdue' && e.target.id !== 'evtime')) return;
  var sp = e.target.parentNode.querySelector('span'); if (!sp) return;
  if (e.target.id === 'evdue') { st.evForm.due = e.target.value; sp.textContent = e.target.value ? exFmt(e.target.value) : 'עוד אין תאריך'; }
  else { st.evForm.time = e.target.value; sp.textContent = e.target.value || 'בלי שעה'; }
}
document.addEventListener('input', evPick, true);
document.addEventListener('change', evPick, true);
if (st.me && st.screen === 'main') { renderChips(); renderList(); }
