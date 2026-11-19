/* 📝 לוח מבחנים — exam board for the kids, in its own window (☰ → קבוצות → לוח מבחנים).
   Each exam is stored as a task in the "kids" list with exam:true, kid, subject, due (date) and
   details (what to study). Kept out of the normal task lists; shown only on the board.
   Everyone sees the board; Kobi & Orit add for any kid, each kid adds for themself; only Kobi & Orit delete. */
var SUBJECTS = {
  aviv: ['שפה', 'תל״ן', 'חנ״ג', 'מדעים', 'אנגלית', 'תרבות ישראל', 'טד', 'מתמטיקה', 'לשון', 'גיאוגרפיה', 'תנ״ך', 'חינוך', 'ביוטק', 'ערבית', 'היסטוריה', 'חינוך פיננסי'],
  yuval: ['אנגלית', 'תל״ן גלילאו', 'מתמטיקה', 'מולדת', 'מורשת', 'מדעים', 'שפה', 'תאטרון', 'קריאה דיאלוגית', 'כישורי חיים', 'חנ״ג', 'חינוך פיננסי', 'תנ״ך', 'מוזיקה', 'טד', 'חינוך'],
  omer: ['ספורט', 'שפה', 'תיאטרון', 'מדעים', 'גיאומטריה', 'מתמטיקה', 'טד', 'תל״ן', 'אנגלית', 'מולדת', 'תורה', 'אומנות', 'מוזיקה', 'חינוך פיננסי', 'תרבות יהודית', 'קריאה דיאלוגית', 'כישורי חיים']
};
var KIDS = ['aviv', 'yuval', 'omer'];
var EXAMS = { id: 'exams', name: 'לוח מבחנים', color: '#7c4dcc', icon: '📝' };
L.exams = EXAMS;
st.exams = []; st.exKid = 'all'; st.exForm = null; st.exPast = false;
function exAdmin() { return st.me && (st.me.id === 'kobi' || st.me.id === 'orit'); }
function exFmt(v) { var p = v.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]); return 'יום ' + WD[d.getDay()] + ', ' + d.getDate() + '.' + (d.getMonth() + 1) + '.' + String(d.getFullYear()).slice(2); }
function exLeft(v) {
  var n = dayDiff(v);
  if (n < 0) return { t: 'עבר', c: 'past' };
  if (n === 0) return { t: 'היום!', c: 'today' };
  if (n === 1) return { t: 'מחר', c: 'soon' };
  return { t: 'בעוד ' + n + ' ימים', c: n <= 7 ? 'soon' : '' };
}
/* keep exams out of the normal lists */
function patchStoreExams() {
  if (!store || store._exPatched) return;
  store._exPatched = true;
  var sub = store.subscribeTasks;
  store.subscribeTasks = function (lists, cb, err) {
    return sub.call(store, lists, function (tasks) {
      st.exams = tasks.filter(function (t) { return t.exam; });
      cb(tasks.filter(function (t) { return !t.exam; }));
      if (st.active === 'exams') renderList();
    }, err);
  };
}
var _startMainX = startMain;
startMain = function (p) { patchStoreExams(); _startMainX(p); };
if (st.me) startMain(st.me.id);
/* drawer: after the groups */
var _renderChipsX = renderChips;
renderChips = function () {
  _renderChipsX();
  if (!st.drawer || !st.me) return;
  var secs = document.querySelectorAll('#drawer .dsec'), grp = null;
  secs.forEach(function (s) { if (s.textContent === 'קבוצות') grp = s; });
  if (!grp) return;
  var n = grp.nextElementSibling; while (n && n.classList.contains('drow')) n = n.nextElementSibling;
  var up = st.exams.filter(function (t) { return t.due && dayDiff(t.due) >= 0 && dayDiff(t.due) <= 7; }).length;
  var tmp = document.createElement('div'); tmp.innerHTML = listRow(EXAMS, up);
  grp.parentNode.insertBefore(tmp.firstChild, n);
};
/* the board */
var _renderListX = renderList;
renderList = function () {
  if (st.active !== 'exams') return _renderListX.apply(this, arguments);
  var el = document.getElementById('list'); if (!el) return;
  var af = document.getElementById('addform'); if (af) af.style.display = 'none';
  var all = st.exams.filter(function (t) { return st.exKid === 'all' || t.kid === st.exKid; })
    .sort(function (a, b) { return (a.due || '9').localeCompare(b.due || '9'); });
  var up = all.filter(function (t) { return !t.due || dayDiff(t.due) >= 0; }), past = all.filter(function (t) { return t.due && dayDiff(t.due) < 0; }).reverse();
  var h = '<div class="listhead"><div class="lh"><h1>📝 לוח מבחנים</h1></div><button class="btn exadd" data-ex="new">+ מבחן</button></div>' +
    '<div class="exkids"><button class="' + (st.exKid === 'all' ? 'on' : '') + '" data-ex-kid="all">כולם</button>' +
    KIDS.map(function (k) { return '<button class="' + (st.exKid === k ? 'on' : '') + '" data-ex-kid="' + k + '" style="--kc:' + P[k].color + '">' + esc(P[k].name) + '</button>'; }).join('') + '</div>';
  if (!up.length) h += '<div class="empty"><div class="big">📝</div>אין מבחנים קרובים' + (st.exKid !== 'all' ? ' ל' + esc(P[st.exKid].name) : '') + '.<br>לוחצים על "+ מבחן" כדי להוסיף.</div>';
  h += up.map(exRow).join('');
  if (past.length) {
    h += '<button class="exshowpast" data-ex="past">' + (st.exPast ? '▾' : '◂') + ' מבחנים שעברו (' + past.length + ')</button>';
    if (st.exPast) h += past.map(exRow).join('');
  }
  el.innerHTML = h;
};
function exRow(t) {
  var k = P[t.kid] || {}, lf = t.due ? exLeft(t.due) : { t: 'בלי תאריך', c: '' };
  return '<button class="exrow ' + lf.c + '" data-ex="' + t.id + '" style="--kc:' + (k.color || '#888') + '">' +
    '<span class="exsub">' + esc(t.subject || t.title) + ' <span class="exkid">(' + esc(k.name || '') + ')</span></span>' +
    '<span class="exdate">' + (t.due ? exFmt(t.due) : '') + '</span>' +
    '<span class="exleft">' + lf.t + '</span>' +
    (t.details ? '<span class="exnote">📓 ' + esc(t.details.split('\n')[0].slice(0, 60)) + '</span>' : '') + '</button>';
}
/* add / edit window */
function exOpen(id) {
  var t = id && id !== 'new' ? st.exams.filter(function (x) { return x.id === id; })[0] : null;
  var kid = t ? t.kid : (KIDS.indexOf(st.me.id) >= 0 ? st.me.id : (st.exKid !== 'all' ? st.exKid : 'aviv'));
  st.exForm = { id: t ? t.id : null, kid: kid, subject: t ? t.subject : '', due: t ? t.due : '', details: t ? (t.details || '') : '', other: false };
  if (t && SUBJECTS[kid].indexOf(t.subject) < 0) st.exForm.other = true;
  exDraw();
}
function exCanEditKid() { return exAdmin(); }
function exDraw() {
  var f = st.exForm, w = document.getElementById('exwin');
  if (!f) { if (w) w.remove(); document.documentElement.classList.remove('nbopen'); return; }
  if (!w) { w = document.createElement('div'); w.id = 'exwin'; document.body.appendChild(w); }
  document.documentElement.classList.add('nbopen');
  var subs = SUBJECTS[f.kid] || [];
  w.innerHTML = '<div class="nbback" data-ex-x="1"></div><div class="nbcard excard" role="dialog">' +
    '<div class="nbhead"><span class="nbic">📝</span><span class="nbtitle">' + (f.id ? 'עריכת מבחן' : 'מבחן חדש') + '</span><button type="button" class="nbclose" data-ex-x="1">✕</button></div>' +
    '<div class="exlbl">למי</div><div class="exkids">' + KIDS.map(function (k) {
      var dis = !exCanEditKid() && k !== st.me.id;
      return '<button type="button" class="' + (f.kid === k ? 'on' : '') + '" ' + (dis ? 'disabled' : 'data-ex-fkid="' + k + '"') + ' style="--kc:' + P[k].color + '">' + esc(P[k].name) + '</button>';
    }).join('') + '</div>' +
    '<div class="exlbl">מקצוע</div><div class="exsubs">' + subs.map(function (s) {
      return '<button type="button" class="' + (!f.other && f.subject === s ? 'on' : '') + '" data-ex-sub="' + esc(s) + '">' + esc(s) + '</button>';
    }).join('') + '<button type="button" class="' + (f.other ? 'on' : '') + '" data-ex-sub="__other">אחר…</button></div>' +
    (f.other ? '<input class="inp" id="exother" maxlength="40" placeholder="שם המקצוע" value="' + esc(f.subject) + '">' : '') +
    '<div class="exlbl">תאריך</div><label class="exdatein"><input type="date" id="exdue" value="' + esc(f.due) + '"><span>' + (f.due ? exFmt(f.due) : 'בחירת תאריך…') + '</span></label>' +
    '<div class="exlbl">חומר למבחן <small>(לא חובה)</small></div><textarea id="exdet" maxlength="2000" placeholder="פרקים, עמודים, מה ללמוד…">' + esc(f.details) + '</textarea>' +
    '<div class="nbact"><button type="button" class="btn" data-ex-save="1">שמירה</button><button type="button" class="btn soft" data-ex-x="1">ביטול</button>' +
    (f.id && exAdmin() ? '<button type="button" class="btn danger ' + (st.sure === 'ex-' + f.id ? 'sure' : '') + '" data-ex-del="1">' + (st.sure === 'ex-' + f.id ? 'בטוח?' : '🗑') + '</button>' : '') + '</div></div>';
}
function exGrab() {
  var f = st.exForm; if (!f) return;
  var o = document.getElementById('exother'); if (o) f.subject = o.value;
  var d = document.getElementById('exdet'); if (d) f.details = d.value;
  var due = document.getElementById('exdue'); if (due) f.due = due.value;
}
function exSave() {
  exGrab(); var f = st.exForm;
  var subject = clean(f.subject, 40);
  if (!subject) return toast('בוחרים מקצוע 👆');
  if (!f.due) return toast('בוחרים תאריך 📅');
  var data = { exam: true, kid: f.kid, subject: subject, due: f.due, time: '', title: 'מבחן ב' + subject + ' (' + P[f.kid].name + ')',
               details: String(f.details || '').replace(/\s+$/, '').slice(0, 2000) };
  var id = f.id; st.exForm = null; exDraw();
  var p = id ? store.update(id, data)
             : store.add(Object.assign(data, { list: 'kids', topic: '', done: false, createdBy: st.me.id, createdAt: Date.now(), doneBy: '', doneAt: 0, notes: [] }));
  p.then(function () { toast('📝 ' + data.title + ' · ' + exFmt(data.due)); }).catch(fail);
}
document.addEventListener('click', function (e) {
  var t = e.target, b;
  if (st.active === 'exams') {
    if ((b = t.closest('[data-ex-kid]'))) { st.exKid = b.getAttribute('data-ex-kid'); return renderList(); }
    if ((b = t.closest('[data-ex]'))) {
      var v = b.getAttribute('data-ex');
      if (v === 'past') { st.exPast = !st.exPast; return renderList(); }
      return exOpen(v);
    }
  }
  if (!st.exForm) return;
  if ((b = t.closest('[data-ex-fkid]'))) { exGrab(); st.exForm.kid = b.getAttribute('data-ex-fkid'); if (!st.exForm.other) st.exForm.subject = ''; return exDraw(); }
  if ((b = t.closest('[data-ex-sub]'))) {
    exGrab(); var s = b.getAttribute('data-ex-sub');
    if (s === '__other') { st.exForm.other = true; st.exForm.subject = ''; exDraw(); var o = document.getElementById('exother'); if (o) o.focus(); return; }
    st.exForm.other = false; st.exForm.subject = s; return exDraw();
  }
  if (t.closest('[data-ex-save]')) return exSave();
  if (t.closest('[data-ex-del]')) {
    var id = st.exForm.id;
    if (st.sure !== 'ex-' + id) { exGrab(); st.sure = 'ex-' + id; return exDraw(); }
    st.sure = null; st.exForm = null; exDraw();
    return store.remove(id).then(function () { toast('🗑 המבחן נמחק'); }).catch(fail);
  }
  if (t.closest('[data-ex-x]')) { st.exForm = null; st.sure = null; return exDraw(); }
}, true);
document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'exdue' && st.exForm) { exGrab(); exDraw(); }
}, true);
document.addEventListener('click', function (e) {
  var lab = e.target.closest && e.target.closest('.exdatein');
  if (lab) { var i = lab.querySelector('input'); if (i && i.showPicker) { try { i.showPicker(); e.preventDefault(); } catch (er) {} } }
});
