/* 🏅 חוגים — after-school activities, in their own window (☰ → קבוצות → חוגים).
   Stored as items in the "family" list with chug:true, who (person), title, mode:
   'fixed' (slots: [{d: 0-6, t:'HH:MM'}] every week) or 'var' (dates: [{date:'YYYY-MM-DD', t:'HH:MM'}]).
   Kept out of the task lists. Everyone sees them; Kobi & Orit add / edit / delete. */
var CHUG = { id: 'chug', name: 'חוגים', color: '#9a3412', icon: '🏅' };
L.chug = CHUG;
var CHUG_NAMES = ['אנגלית', 'תופים', 'נבחרת', 'הגנה עצמית', 'כדורסל', 'כדורגל', 'חדר כושר', 'צופים', 'מתמטיקה', 'דורית', 'תזמורת', 'הוראה מתקנת']
  .sort(function (a, b) { return a.localeCompare(b, 'he'); });
var CH_WHO = ['aviv', 'yuval', 'omer', 'kobi', 'orit'];
var WD1 = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
st.chugs = []; st.chWho = 'all'; st.chForm = null;
function chAdmin() { return st.me && (st.me.id === 'kobi' || st.me.id === 'orit'); }
function patchStoreChug() {
  if (!store || store._chPatched) return;
  store._chPatched = true;
  var sub = store.subscribeTasks;
  store.subscribeTasks = function (lists, cb, err) {
    return sub.call(store, lists, function (tasks) {
      st.chugs = tasks.filter(function (t) { return t.chug; });
      cb(tasks.filter(function (t) { return !t.chug; }));
      if (st.active === 'chug') renderList();
    }, err);
  };
}
var _startMainC = startMain;
startMain = function (p) { patchStoreChug(); _startMainC(p); };
if (st.me) startMain(st.me.id);
var _renderChipsC = renderChips;
renderChips = function () {
  _renderChipsC();
  if (!st.drawer || !st.me) return;
  var grp = null; document.querySelectorAll('#drawer .dsec').forEach(function (s) { if (s.textContent === 'קבוצות') grp = s; });
  if (!grp) return;
  var n = grp.nextElementSibling; while (n && n.classList.contains('drow')) n = n.nextElementSibling;
  var tmp = document.createElement('div'); tmp.innerHTML = listRow(CHUG, st.chugs.length);
  grp.parentNode.insertBefore(tmp.firstChild, n);
};
function chDateFmt(v) { var p = v.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]); return 'יום ' + WD[d.getDay()] + ', ' + d.getDate() + '.' + (d.getMonth() + 1); }
function chRow(c, time, extra) {
  var p = P[c.who] || {};
  return '<button class="chrow" data-ch="' + c.id + '" style="--kc:' + (p.color || '#888') + '"><span class="chtime">' + esc(time || '—') + '</span>' +
    '<span class="chname">' + esc(c.title) + '</span><span class="chwho">' + esc(p.name || '') + '</span>' + (extra ? '<span class="chx">' + extra + '</span>' : '') + '</button>';
}
var _renderListC = renderList;
renderList = function () {
  if (st.active !== 'chug') return _renderListC.apply(this, arguments);
  var el = document.getElementById('list'); if (!el) return;
  var af = document.getElementById('addform'); if (af) af.style.display = 'none';
  var mine = st.chugs.filter(function (c) { return st.chWho === 'all' || c.who === st.chWho; });
  var who = CH_WHO.filter(function (k) { return st.chugs.some(function (c) { return c.who === k; }); });
  var h = '<div class="listhead"><div class="lh"><h1>🏅 חוגים</h1></div>' + (chAdmin() ? '<button class="btn exadd chbtn" data-ch="new">+ חוג</button>' : '') + '</div>';
  if (who.length > 1) h += '<div class="exkids"><button class="' + (st.chWho === 'all' ? 'on' : '') + '" data-ch-who="all">כולם</button>' +
    who.map(function (k) { return '<button class="' + (st.chWho === k ? 'on' : '') + '" data-ch-who="' + k + '" style="--kc:' + P[k].color + '">' + esc(P[k].name) + '</button>'; }).join('') + '</div>';
  if (!mine.length) h += '<div class="empty"><div class="big">🏅</div>אין עדיין חוגים.' + (chAdmin() ? '<br>לוחצים על "+ חוג".' : '') + '</div>';
  /* weekly timetable */
  var today = new Date().getDay(), week = '';
  for (var i = 0; i < 7; i++) {
    var d = (today + i) % 7, rows = [];
    mine.forEach(function (c) { if (c.mode !== 'var') (c.slots || []).forEach(function (s) { if (+s.d === d) rows.push({ c: c, t: s.t || '' }); }); });
    if (!rows.length) continue;
    rows.sort(function (a, b) { return (a.t || '99').localeCompare(b.t || '99'); });
    week += '<div class="chday' + (i === 0 ? ' today' : '') + '"><div class="chdh">יום ' + WD[d] + (i === 0 ? ' · היום' : i === 1 ? ' · מחר' : '') + '</div>' + rows.map(function (r) { return chRow(r.c, r.t); }).join('') + '</div>';
  }
  if (week) h += '<div class="chsec">📅 כל שבוע</div>' + week;
  /* changing dates — upcoming */
  var td = ymd(addDays(0)), vs = [];
  mine.forEach(function (c) { if (c.mode === 'var') (c.dates || []).forEach(function (x) { if (x.date >= td) vs.push({ c: c, date: x.date, t: x.t || '' }); }); });
  vs.sort(function (a, b) { return (a.date + a.t).localeCompare(b.date + b.t); });
  if (vs.length) h += '<div class="chsec">🗓 מועדים משתנים</div>' + vs.map(function (r) { return chRow(r.c, r.t, chDateFmt(r.date) + (r.date === td ? ' · היום' : '')); }).join('');
  var noTime = mine.filter(function (c) { return c.mode === 'var' ? !(c.dates || []).some(function (x) { return x.date >= td; }) : !(c.slots || []).length; });
  if (noTime.length) h += '<div class="chsec">בלי מועד קרוב</div>' + noTime.map(function (c) { return chRow(c, ''); }).join('');
  el.innerHTML = h;
};
function chOpen(id) {
  if (!chAdmin()) return;
  var c = id && id !== 'new' ? st.chugs.filter(function (x) { return x.id === id; })[0] : null;
  st.chForm = c ? { id: c.id, who: c.who, title: c.title, other: CHUG_NAMES.indexOf(c.title) < 0, mode: c.mode || 'fixed',
                    slots: (c.slots || []).map(function (s) { return { d: +s.d, t: s.t || '' }; }), dates: (c.dates || []).map(function (x) { return { date: x.date, t: x.t || '' }; }), details: c.details || '' }
                : { id: null, who: st.chWho !== 'all' ? st.chWho : 'aviv', title: '', other: false, mode: 'fixed', slots: [{ d: 0, t: '' }], dates: [{ date: '', t: '' }], details: '' };
  if (!st.chForm.slots.length) st.chForm.slots.push({ d: 0, t: '' });
  if (!st.chForm.dates.length) st.chForm.dates.push({ date: '', t: '' });
  chDraw();
}
function chDraw() {
  var f = st.chForm, w = document.getElementById('chwin');
  if (!f) { if (w) w.remove(); document.documentElement.classList.remove('nbopen'); return; }
  if (!w) { w = document.createElement('div'); w.id = 'chwin'; w.className = 'exwinlike'; document.body.appendChild(w); }
  document.documentElement.classList.add('nbopen');
  var rows = f.mode === 'fixed'
    ? f.slots.map(function (s, i) {
        return '<div class="chslot"><div class="chdays">' + WD1.map(function (n, d) { return '<button type="button" class="' + (s.d === d ? 'on' : '') + '" data-ch-day="' + i + ':' + d + '">' + n + '</button>'; }).join('') + '</div>' +
          '<label class="exdatein chtimein"><input type="time" data-ch-t="s' + i + '" value="' + esc(s.t) + '"><span>' + (s.t || 'שעה') + '</span></label>' +
          (f.slots.length > 1 ? '<button type="button" class="chdel" data-ch-rm="s' + i + '">✕</button>' : '') + '</div>';
      }).join('') + '<button type="button" class="chadd" data-ch-addrow="1">+ עוד יום בשבוע</button>'
    : f.dates.map(function (x, i) {
        return '<div class="chslot"><label class="exdatein chdatein"><input type="date" data-ch-dt="' + i + '" value="' + esc(x.date) + '"><span>' + (x.date ? chDateFmt(x.date) : 'תאריך') + '</span></label>' +
          '<label class="exdatein chtimein"><input type="time" data-ch-t="v' + i + '" value="' + esc(x.t) + '"><span>' + (x.t || 'שעה') + '</span></label>' +
          (f.dates.length > 1 ? '<button type="button" class="chdel" data-ch-rm="v' + i + '">✕</button>' : '') + '</div>';
      }).join('') + '<button type="button" class="chadd" data-ch-addrow="1">+ עוד מועד</button>';
  w.innerHTML = '<div class="nbback" data-ch-x="1"></div><div class="nbcard excard" role="dialog">' +
    '<div class="nbhead"><span class="nbic">🏅</span><span class="nbtitle">' + (f.id ? 'עריכת חוג' : 'חוג חדש') + '</span><button type="button" class="nbclose" data-ch-x="1">✕</button></div>' +
    '<div class="exlbl">למי</div><div class="exkids">' + CH_WHO.map(function (k) {
      return '<button type="button" class="' + (f.who === k ? 'on' : '') + '" data-ch-fwho="' + k + '" style="--kc:' + P[k].color + '">' + esc(P[k].name) + '</button>'; }).join('') + '</div>' +
    '<div class="exlbl">חוג</div><div class="exsubs chsubs">' + CHUG_NAMES.map(function (s) {
      return '<button type="button" class="' + (!f.other && f.title === s ? 'on' : '') + '" data-ch-name="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') +
      '<button type="button" class="' + (f.other ? 'on' : '') + '" data-ch-name="__other">אחר…</button></div>' +
    (f.other ? '<input class="inp" id="chother" maxlength="40" placeholder="שם החוג" value="' + esc(f.title) + '">' : '') +
    '<div class="exlbl">מתי</div><div class="exkids chmode"><button type="button" class="' + (f.mode === 'fixed' ? 'on' : '') + '" data-ch-mode="fixed" style="--kc:#9a3412">קבוע כל שבוע</button>' +
      '<button type="button" class="' + (f.mode === 'var' ? 'on' : '') + '" data-ch-mode="var" style="--kc:#9a3412">משתנה</button></div>' + rows +
    '<div class="exlbl">פרטים <small>(מקום, מדריך, טלפון — לא חובה)</small></div><textarea id="chdet" maxlength="1000">' + esc(f.details) + '</textarea>' +
    '<div class="nbact"><button type="button" class="btn" data-ch-save="1">שמירה</button><button type="button" class="btn soft" data-ch-x="1">ביטול</button>' +
    (f.id ? '<button type="button" class="btn danger ' + (st.sure === 'ch-' + f.id ? 'sure' : '') + '" data-ch-del="1">' + (st.sure === 'ch-' + f.id ? 'בטוח?' : '🗑') + '</button>' : '') + '</div></div>';
}
function chGrab() {
  var f = st.chForm; if (!f) return;
  var o = document.getElementById('chother'); if (o) f.title = o.value;
  var d = document.getElementById('chdet'); if (d) f.details = d.value;
  document.querySelectorAll('#chwin [data-ch-t]').forEach(function (i) { var k = i.getAttribute('data-ch-t'), n = +k.slice(1); if (k[0] === 's' && f.slots[n]) f.slots[n].t = i.value; if (k[0] === 'v' && f.dates[n]) f.dates[n].t = i.value; });
  document.querySelectorAll('#chwin [data-ch-dt]').forEach(function (i) { var n = +i.getAttribute('data-ch-dt'); if (f.dates[n]) f.dates[n].date = i.value; });
}
function chSave() {
  chGrab(); var f = st.chForm, title = clean(f.title, 40);
  if (!title) return toast('בוחרים חוג 👆');
  var slots = f.slots.filter(function (s) { return s.d >= 0; }).map(function (s) { return { d: s.d, t: s.t || '' }; });
  var dates = f.dates.filter(function (x) { return x.date; }).map(function (x) { return { date: x.date, t: x.t || '' }; });
  if (f.mode === 'var' && !dates.length) return toast('בוחרים לפחות תאריך אחד 📅');
  var data = { chug: true, who: f.who, title: title, mode: f.mode, slots: f.mode === 'fixed' ? slots : [], dates: f.mode === 'var' ? dates : [],
               details: String(f.details || '').replace(/\s+$/, '').slice(0, 1000), due: '', time: '' };
  var id = f.id; st.chForm = null; chDraw();
  var p = id ? store.update(id, data) : store.add(Object.assign(data, { list: 'family', topic: '', done: false, createdBy: st.me.id, createdAt: Date.now(), doneBy: '', doneAt: 0, notes: [] }));
  p.then(function () { toast('🏅 ' + title + ' (' + P[f.who].name + ') נשמר'); }).catch(fail);
}
document.addEventListener('click', function (e) {
  var t = e.target, b;
  if (st.active === 'chug') {
    if ((b = t.closest('[data-ch-who]'))) { st.chWho = b.getAttribute('data-ch-who'); return renderList(); }
    if ((b = t.closest('[data-ch]'))) return chOpen(b.getAttribute('data-ch'));
  }
  if (!st.chForm) return;
  var f = st.chForm;
  if ((b = t.closest('[data-ch-fwho]'))) { chGrab(); f.who = b.getAttribute('data-ch-fwho'); return chDraw(); }
  if ((b = t.closest('[data-ch-name]'))) {
    chGrab(); var s = b.getAttribute('data-ch-name');
    if (s === '__other') { f.other = true; f.title = ''; chDraw(); var o = document.getElementById('chother'); if (o) o.focus(); return; }
    f.other = false; f.title = s; return chDraw();
  }
  if ((b = t.closest('[data-ch-mode]'))) { chGrab(); f.mode = b.getAttribute('data-ch-mode'); return chDraw(); }
  if ((b = t.closest('[data-ch-day]'))) { chGrab(); var p = b.getAttribute('data-ch-day').split(':'); f.slots[+p[0]].d = +p[1]; return chDraw(); }
  if (t.closest('[data-ch-addrow]')) { chGrab(); if (f.mode === 'fixed') f.slots.push({ d: (f.slots[f.slots.length - 1].d + 2) % 7, t: f.slots[f.slots.length - 1].t }); else f.dates.push({ date: '', t: f.dates[f.dates.length - 1].t }); return chDraw(); }
  if ((b = t.closest('[data-ch-rm]'))) { chGrab(); var k = b.getAttribute('data-ch-rm'); (k[0] === 's' ? f.slots : f.dates).splice(+k.slice(1), 1); return chDraw(); }
  if (t.closest('[data-ch-save]')) return chSave();
  if (t.closest('[data-ch-del]')) {
    if (st.sure !== 'ch-' + f.id) { chGrab(); st.sure = 'ch-' + f.id; return chDraw(); }
    var id = f.id; st.sure = null; st.chForm = null; chDraw();
    return store.remove(id).then(function () { toast('🗑 החוג נמחק'); }).catch(fail);
  }
  if (t.closest('[data-ch-x]')) { st.chForm = null; st.sure = null; return chDraw(); }
}, true);
/* pickers: update only the label (redrawing would close the phone's picker) */
function chPick(e) {
  var i = e.target; if (!st.chForm || !i || !i.closest || !i.closest('#chwin')) return;
  var sp = i.parentNode.querySelector('span'); if (!sp) return;
  if (i.hasAttribute('data-ch-t')) sp.textContent = i.value || 'שעה';
  if (i.hasAttribute('data-ch-dt')) sp.textContent = i.value ? chDateFmt(i.value) : 'תאריך';
}
document.addEventListener('input', chPick, true);
document.addEventListener('change', chPick, true);
