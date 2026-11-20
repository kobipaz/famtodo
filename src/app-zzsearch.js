/* 🔍 Search on the home screen — finds anything: tasks (title, topic, details, notes), lists and people,
   exams, activities, birthdays, family events and the boards themselves. Tapping a result goes there. */
st.q = '';
var SQ_FIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };   /* final letters match their regular form (מבחן ↔ מבחנים) */
function sqNorm(s) { return String(s || '').toLowerCase().replace(/[ךםןףץ]/g, function (c) { return SQ_FIN[c]; }).replace(/[֑-ׇ]/g, '').replace(/[״"'׳`]/g, '').replace(/\s+/g, ' ').trim(); }
function sqHas(q, parts) { var hay = sqNorm(parts.join(' ')); return q.split(' ').every(function (w) { return hay.indexOf(w) >= 0; }); }
function sqResults(raw) {
  var q = sqNorm(raw), out = [];
  if (!q) return out;
  /* places: people, groups, boards */
  var places = st.lists.concat(['exams', 'chug', 'recur', 'bday', 'events'].filter(function (id) { return L[id]; }));
  if (st.me.id === 'kobi' || st.me.id === 'orit') places.push('all');
  places.push('archive');
  places.forEach(function (id) {
    var l = L[id] || (id === 'all' ? ALL : id === 'archive' ? ARCH : null); if (!l) return;
    if (sqHas(q, [l.name])) out.push({ g: 'מקומות', ic: l.icon || '👤', t: l.name, s: '', c: l.color, go: { list: id } });
  });
  /* tasks */
  st.tasks.forEach(function (t) {
    if (t.archived && typeof inMyArchive === 'function' && !inMyArchive(t)) return;
    var notes = (t.notes || []).map(function (n) { return n.text; });
    if (!sqHas(q, [t.title, t.topic, t.details].concat(notes))) return;
    var l = L[t.list] || {}, d = t.due ? dueLabel(t.due).txt : '';
    out.push({ g: 'משימות', ic: t.done ? '✔' : t.repeat ? '🔁' : '•', t: t.title, done: t.done || t.archived,
               s: (l.name || '') + (t.topic ? ' · ' + t.topic : '') + (d ? ' · ' + d : '') + (t.archived ? ' · בארכיון' : ''), c: l.color, go: { task: t } });
  });
  (st.exams || []).forEach(function (e) {
    var k = P[e.kid] || {};
    if (sqHas(q, [e.subject, e.title, k.name, e.details, 'מבחן'])) out.push({ g: 'מבחנים', ic: '📝', t: e.subject + ' (' + (k.name || '') + ')', s: e.due ? exFmt(e.due) + ' · ' + exLeft(e.due).t : '', c: k.color, go: { list: 'exams', ex: e.id } });
  });
  (st.chugs || []).forEach(function (c) {
    var p = P[c.who] || {};
    if (sqHas(q, [c.title, p.name, c.details, 'חוג'])) out.push({ g: 'חוגים', ic: '🏅', t: c.title + ' (' + (p.name || '') + ')', s: c.mode === 'var' ? 'מועדים משתנים' : (c.slots || []).map(function (s) { return 'יום ' + WD[+s.d] + (s.t ? ' ' + s.t : ''); }).join(', '), c: p.color, go: { list: 'chug', ch: c.id } });
  });
  (st.bdays || []).forEach(function (b) {
    if (!sqHas(q, [b.title, 'יום הולדת'])) return;
    var x = typeof bdNext === 'function' ? bdNext(b.md) : null;
    out.push({ g: 'ימי הולדת', ic: '🎂', t: b.title, s: x ? bdDays(x.days) + ' · ' + (+b.md.slice(3)) + '.' + (+b.md.slice(0, 2)) : 'אין תאריך', c: L.bday && L.bday.color, go: { list: 'bday', bd: b.id } });
  });
  (st.events || []).forEach(function (e) {
    if (sqHas(q, [e.title, e.place, e.details, 'אירוע'])) out.push({ g: 'אירועים', ic: '🎉', t: e.title, s: e.due ? exFmt(e.due) + ' · ' + exLeft(e.due).t : 'עוד אין תאריך', c: L.events && L.events.color, go: { list: 'events', ev: e.id } });
  });
  return out;
}
function sqDraw() {
  var box = document.getElementById('sqres'), list = document.getElementById('list');
  if (!box || !list) return;
  var res = sqResults(st.q);
  if (!sqNorm(st.q)) { box.innerHTML = ''; box.style.display = 'none'; list.style.display = ''; return; }
  list.style.display = 'none'; box.style.display = '';
  if (!res.length) { box.innerHTML = '<div class="empty"><div class="big">🔍</div>לא נמצא שום דבר עם "' + esc(st.q) + '"</div>'; return; }
  var h = '', g = '';
  res.slice(0, 80).forEach(function (r, i) {
    if (r.g !== g) { h += '<div class="hmsec">' + r.g + '</div>'; g = r.g; }
    h += '<button class="sqrow' + (r.done ? ' done' : '') + '" data-sq="' + i + '" style="--kc:' + (r.c || '#888') + '"><span class="sqic">' + r.ic + '</span>' +
      '<span class="sqtx"><span class="sqt">' + esc(r.t) + '</span>' + (r.s ? '<span class="sqs">' + esc(r.s) + '</span>' : '') + '</span></button>';
  });
  box.innerHTML = h; box._res = res;
}
function sqGo(r) {
  var go = r.go; st.q = ''; var inp = document.getElementById('sqin'); if (inp) { inp.value = ''; inp.blur(); }
  var target = go.list;
  if (go.task) target = go.task.archived ? 'archive' : (st.lists.indexOf(go.task.list) >= 0 ? go.task.list : 'all');
  st.drawer = false; st.active = target; st.open = go.task ? go.task.id : null; st.editing = null;
  if (go.ex) st.exKid = 'all';
  if (go.ch) st.chWho = 'all';
  sqBar(); renderChips(); renderList(); window.scrollTo(0, 0);
  if (go.task) setTimeout(function () { var el = document.querySelector('[data-id="' + go.task.id + '"]'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }, 60);
  if (go.ex && typeof exOpen === 'function') exOpen(go.ex);
  if (go.ch && typeof chOpen === 'function') chOpen(go.ch);
  if (go.bd && typeof bdOpen === 'function') bdOpen(go.bd);
  if (go.ev && typeof evOpen === 'function') evOpen(go.ev);
}
/* the bar lives outside #list so live updates of the home screen don't close the keyboard */
function sqBar() {
  var bar = document.getElementById('sqbar'), list = document.getElementById('list');
  var show = st.me && st.screen === 'main' && st.active === 'home' && list;
  if (!show) {
    if (bar) bar.remove(); var r = document.getElementById('sqres'); if (r) r.remove();
    if (list) list.style.display = ''; return;
  }
  if (!bar) {
    bar = document.createElement('div'); bar.id = 'sqbar';
    bar.innerHTML = '<span class="sqmag">🔍</span><input id="sqin" type="search" enterkeyhint="search" autocomplete="off" placeholder="חיפוש"><button type="button" class="sqx" data-sq-x="1" aria-label="ניקוי">✕</button>';
    list.parentNode.insertBefore(bar, list);
    var res = document.createElement('div'); res.id = 'sqres'; res.style.display = 'none'; list.parentNode.insertBefore(res, list);
  }
  bar.classList.toggle('has', !!st.q);
  sqDraw();
}
var _renderListSQ = renderList;
renderList = function () { var r = _renderListSQ.apply(this, arguments); sqBar(); return r; };
document.addEventListener('input', function (e) {
  if (!e.target || e.target.id !== 'sqin') return;
  st.q = e.target.value; document.getElementById('sqbar').classList.toggle('has', !!st.q); sqDraw();
});
document.addEventListener('click', function (e) {
  var t = e.target, b;
  if (t.closest && t.closest('[data-sq-x]')) { st.q = ''; var i = document.getElementById('sqin'); i.value = ''; i.focus(); document.getElementById('sqbar').classList.remove('has'); return sqDraw(); }
  if (t.closest && (b = t.closest('[data-sq]'))) { var box = document.getElementById('sqres'); var r = box && box._res && box._res[+b.getAttribute('data-sq')]; if (r) { e.stopPropagation(); sqGo(r); } }
}, true);
if (st.me && st.screen === 'main') sqBar();
