/* 🔁 משימות קבועות — repeating tasks (daily / weekly / monthly / yearly).
   A repeating task is a normal task with repeat:'daily'|'weekly'|'monthly'|'yearly' and a due date.
   It shows in its list like any task; marking it done moves it to its next date (with undo).
   Kobi & Orit add / edit / delete them in their own window (☰ → קבוצות → משימות קבועות). */
/* Each family member keeps one color everywhere (P[id].color). Groups / boards get colors that
   don't look like anyone's: family teal, parents dark slate, kids cyan, boards navy / rust / stone / red. */
L.family.color = '#0d9488'; L.parents.color = '#334155'; L.kids.color = '#0891b2';
PEOPLE.forEach(function (p) { if (L[p.id]) L[p.id].color = p.color; });
var RECUR = { id: 'recur', name: 'משימות קבועות', color: '#78716c', icon: '🔁' };
L.recur = RECUR;
var FREQ = { daily: 'יומי', weekly: 'שבועי', monthly: 'חודשי', yearly: 'שנתי' };
var RECUR_PRESETS = ['להוציא זריקות', 'איסוף אשפה מהחדרים', 'לפנות מדיח'];
st.rcForm = null;
function rcAdmin() { return st.me && (st.me.id === 'kobi' || st.me.id === 'orit'); }
function rcParse(v) { var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
function rcStep(d, f) {
  var n = new Date(d.getTime());
  if (f === 'daily') n.setDate(n.getDate() + 1);
  else if (f === 'weekly') n.setDate(n.getDate() + 7);
  else if (f === 'monthly') { var day = d.getDate(); n.setDate(1); n.setMonth(n.getMonth() + 1); n.setDate(Math.min(day, new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate())); }
  else n.setFullYear(n.getFullYear() + 1);
  return n;
}
function rcNext(due, f) {   /* next date after today */
  var d = due ? rcParse(due) : addDays(0), today = ymd(addDays(0));
  do { d = rcStep(d, f); } while (ymd(d) <= today);
  return ymd(d);
}
function rcLabel(t) {
  var d = t.due ? rcParse(t.due) : null;
  if (t.repeat === 'daily') return 'כל יום';
  if (t.repeat === 'weekly') return 'כל שבוע' + (d ? ' ביום ' + WD[d.getDay()] : '');
  if (t.repeat === 'monthly') return 'כל חודש' + (d ? ' ב-' + d.getDate() : '');
  if (t.repeat === 'yearly') return 'כל שנה' + (d ? ' ב-' + d.getDate() + '.' + (d.getMonth() + 1) : '');
  return '';
}
/* badge on the task card */
var _taskHtmlR = taskHtml;
taskHtml = function (t) {
  var h = _taskHtmlR(t);
  if (!t.repeat || t.done) return h;
  return h.replace('<div class="tmeta">', '<div class="tmeta"><span class="rpt">🔁 ' + esc(rcLabel(t)) + '</span>');
};
/* done on a repeating task = move it to its next date */
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-act="toggle"]'); if (!b) return;
  var t = find(b.getAttribute('data-id')); if (!t || !t.repeat || t.done) return;
  e.preventDefault(); e.stopPropagation();
  var prev = { due: t.due || '', lastDoneAt: t.lastDoneAt || 0, lastDoneBy: t.lastDoneBy || '' };
  var patch = { due: rcNext(t.due, t.repeat), lastDoneAt: Date.now(), lastDoneBy: st.me.id };
  Object.assign(t, patch); renderChips(); renderList();
  store.update(t.id, patch).then(function () {
    toast('✔ בוצע · הפעם הבאה: ' + dueLabel(patch.due).txt, 'ביטול', function () { store.update(t.id, prev).catch(fail); });
  }).catch(fail);
}, true);
/* drawer row (after the groups) */
var _renderChipsR = renderChips;
renderChips = function () {
  _renderChipsR();
  if (!st.drawer || !st.me) return;
  var grp = null; document.querySelectorAll('#drawer .dsec').forEach(function (s) { if (s.textContent === 'קבוצות') grp = s; });
  if (!grp) return;
  var n = grp.nextElementSibling; while (n && n.classList.contains('drow')) n = n.nextElementSibling;
  var tmp = document.createElement('div'); tmp.innerHTML = listRow(RECUR, rcAll().length);
  grp.parentNode.insertBefore(tmp.firstChild, n);
};
function rcAll() { return st.tasks.filter(function (t) { return t.repeat && !t.archived && !t.deleted; }).sort(function (a, b) { return (a.due || '').localeCompare(b.due || ''); }); }
/* the window */
var _renderListR = renderList;
renderList = function () {
  if (st.active !== 'recur') return _renderListR.apply(this, arguments);
  var el = document.getElementById('list'); if (!el) return;
  var af = document.getElementById('addform'); if (af) af.style.display = 'none';
  var items = rcAll();
  var h = '<div class="listhead"><div class="lh"><h1>🔁 משימות קבועות</h1></div>' + (rcAdmin() ? '<button class="btn exadd rcbtn" data-rc="new">+ משימה קבועה</button>' : '') + '</div>';
  if (!items.length) h += '<div class="empty"><div class="big">🔁</div>אין עדיין משימות קבועות.' + (rcAdmin() ? '<br>לוחצים על "+ משימה קבועה".' : '') + '</div>';
  h += items.map(function (t) {
    var l = L[t.list] || {}, dl = t.due ? dueLabel(t.due) : null;
    return '<button class="exrow rcrow" data-rc="' + t.id + '" style="--kc:' + (l.color || '#888') + '">' +
      '<span class="exsub">' + esc(t.title) + '</span>' +
      '<span class="exleft">' + (dl ? 'הבא: ' + dl.txt + (t.time ? ' ' + t.time : '') : '') + '</span>' +
      '<span class="exdate">🔁 ' + esc(rcLabel(t)) + ' · <b style="color:var(--kc)">' + esc(l.name || '') + '</b></span></button>';
  }).join('');
  if (!rcAdmin() && items.length) h += '<div class="rcnote">מסמנים ✓ על המשימה ברשימה — והיא עוברת לבד לפעם הבאה.</div>';
  el.innerHTML = h;
};
function rcOpen(id) {
  if (!rcAdmin()) return;
  var t = id && id !== 'new' ? find(id) : null;
  st.rcForm = { id: t ? t.id : null, title: t ? t.title : '', list: t ? t.list : st.me.id, repeat: t ? t.repeat : 'daily',
                due: t ? (t.due || ymd(addDays(0))) : ymd(addDays(0)), time: t ? (t.time || '') : '' };
  rcDraw();
}
function rcDraw() {
  var f = st.rcForm, w = document.getElementById('rcwin');
  if (!f) { if (w) w.remove(); document.documentElement.classList.remove('nbopen'); return; }
  if (!w) { w = document.createElement('div'); w.id = 'rcwin'; w.className = 'exwinlike'; document.body.appendChild(w); }
  document.documentElement.classList.add('nbopen');
  var whenLbl = f.repeat === 'daily' ? 'מתחילים ב-' : f.repeat === 'weekly' ? 'ביום (התאריך הראשון)' : f.repeat === 'monthly' ? 'בתאריך (הראשון)' : 'בתאריך';
  w.innerHTML = '<div class="nbback" data-rc-x="1"></div><div class="nbcard excard" role="dialog">' +
    '<div class="nbhead"><span class="nbic">🔁</span><span class="nbtitle">' + (f.id ? 'עריכת משימה קבועה' : 'משימה קבועה חדשה') + '</span><button type="button" class="nbclose" data-rc-x="1">✕</button></div>' +
    '<div class="exlbl">מה</div><input class="inp" id="rctitle" maxlength="200" placeholder="שם המשימה" value="' + esc(f.title) + '">' +
    '<div class="exsubs">' + RECUR_PRESETS.map(function (p) { return '<button type="button" data-rc-pre="' + esc(p) + '">' + esc(p) + '</button>'; }).join('') + '</div>' +
    '<div class="exlbl">למי</div><div class="exkids">' + st.lists.map(function (id) {
      var l = L[id]; return '<button type="button" class="' + (f.list === id ? 'on' : '') + '" data-rc-list="' + id + '" style="--kc:' + l.color + '">' + (l.icon ? l.icon + ' ' : '') + esc(l.name) + '</button>';
    }).join('') + '</div>' +
    '<div class="exlbl">חזרה</div><div class="exkids rcfreq">' + Object.keys(FREQ).map(function (k) {
      return '<button type="button" class="' + (f.repeat === k ? 'on' : '') + '" data-rc-freq="' + k + '" style="--kc:#78716c">' + FREQ[k] + '</button>';
    }).join('') + '</div>' +
    '<div class="exlbl">' + whenLbl + '</div><label class="exdatein"><input type="date" id="rcdue" value="' + esc(f.due) + '"><span>' + exFmt(f.due) + '</span></label>' +
    '<div class="exlbl">שעה <small>(לא חובה — לתזכורת)</small></div><label class="exdatein"><input type="time" id="rctime" value="' + esc(f.time) + '"><span>' + (f.time || 'בלי שעה') + '</span></label>' +
    '<div class="nbact"><button type="button" class="btn" data-rc-save="1">שמירה</button><button type="button" class="btn soft" data-rc-x="1">ביטול</button>' +
    (f.id ? '<button type="button" class="btn danger ' + (st.sure === 'rc-' + f.id ? 'sure' : '') + '" data-rc-del="1">' + (st.sure === 'rc-' + f.id ? 'בטוח?' : '🗑') + '</button>' : '') + '</div></div>';
}
function rcGrab() {
  var f = st.rcForm; if (!f) return;
  var a = document.getElementById('rctitle'); if (a) f.title = a.value;
  var d = document.getElementById('rcdue'); if (d && d.value) f.due = d.value;
  var tm = document.getElementById('rctime'); if (tm) f.time = tm.value;
}
function rcSave() {
  rcGrab(); var f = st.rcForm, title = clean(f.title, 200);
  if (!title) return toast('כותבים מה המשימה ✏️');
  var data = { title: title, repeat: f.repeat, due: f.due, time: f.time || '' };
  var old = f.id ? find(f.id) : null; st.rcForm = null; rcDraw();
  var p;
  if (!old) p = store.add(Object.assign({ list: f.list, topic: '', done: false, createdBy: st.me.id, createdAt: Date.now(), doneBy: '', doneAt: 0, notes: [] }, data));
  else if (old.list === f.list) p = store.update(old.id, data);
  else p = store.add(Object.assign({ list: f.list, topic: old.topic || '', done: false, createdBy: st.me.id, createdAt: Date.now(), doneBy: '', doneAt: 0,
                                     notes: (old.notes || []).slice(), details: old.details || '' }, data)).then(function () { return store.remove(old.id); });
  p.then(function () { toast('🔁 ' + title + ' · ' + rcLabel(data)); }).catch(fail);
}
document.addEventListener('click', function (e) {
  var t = e.target, b;
  if (st.active === 'recur' && (b = t.closest('[data-rc]'))) return rcOpen(b.getAttribute('data-rc'));
  if (!st.rcForm) return;
  if ((b = t.closest('[data-rc-pre]'))) { var i = document.getElementById('rctitle'); i.value = b.getAttribute('data-rc-pre'); st.rcForm.title = i.value; return; }
  if ((b = t.closest('[data-rc-list]'))) { rcGrab(); st.rcForm.list = b.getAttribute('data-rc-list'); return rcDraw(); }
  if ((b = t.closest('[data-rc-freq]'))) { rcGrab(); st.rcForm.repeat = b.getAttribute('data-rc-freq'); return rcDraw(); }
  if (t.closest('[data-rc-save]')) return rcSave();
  if (t.closest('[data-rc-del]')) {
    var id = st.rcForm.id;
    if (st.sure !== 'rc-' + id) { rcGrab(); st.sure = 'rc-' + id; return rcDraw(); }
    st.sure = null; st.rcForm = null; rcDraw();
    return store.remove(id).then(function () { toast('🗑 המשימה הקבועה נמחקה'); }).catch(fail);
  }
  if (t.closest('[data-rc-x]')) { st.rcForm = null; st.sure = null; return rcDraw(); }
}, true);
/* date/time pickers: update only the label (redrawing would close the phone's picker) */
function rcPick(e) {
  if (!st.rcForm || !e.target || (e.target.id !== 'rcdue' && e.target.id !== 'rctime')) return;
  var sp = e.target.parentNode.querySelector('span'); if (!sp) return;
  if (e.target.id === 'rcdue') { if (e.target.value) { st.rcForm.due = e.target.value; sp.textContent = exFmt(e.target.value); } }
  else { st.rcForm.time = e.target.value; sp.textContent = e.target.value || 'בלי שעה'; }
}
document.addEventListener('input', rcPick, true);
document.addEventListener('change', rcPick, true);
if (st.me && st.screen === 'main') { renderChips(); renderList(); }
