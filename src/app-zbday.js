/* 🎂 ימי הולדת — birthdays with a countdown, in their own window (☰ → קבוצות → ימי הולדת / home tile).
   Stored as items in the "family" list with bday:true, title (name), md ('MM-DD'), year ('' if unknown).
   Kept out of the task lists. Everyone sees them; Kobi & Orit add / edit / delete. */
var BDAY = { id: 'bday', name: 'ימי הולדת', color: '#dc2626', icon: '🎂' };
L.bday = BDAY;
var BD_SEED = [['אמא', '10-07', '1982'], ['אבא', '12-05', '1985'], ['אביב', '04-27', '2015'], ['יובל', '01-26', '2017'], ['עומר', '08-19', '2018'],
  ['סבא חנן', '', ''], ['סבתא טובה', '', ''], ['סבא אלי', '12-14', '1952'], ['סבתא גליה', '04-16', '1951'],
  ['טלי', '', ''], ['רוני', '', ''], ['רינת', '', ''],
  ['ניסים', '', ''], ['רונן', '', ''], ['אריאל', '', ''], ['רועי', '', ''], ['עידו', '', ''], ['רותם', '', ''],
  ['שקד', '', ''], ['נדב', '', ''], ['הדס', '', ''], ['נוגה', '', ''], ['שחר', '', ''], ['שילה', '', '']];
var BD_WHO = { 'אמא': 'orit', 'אבא': 'kobi', 'אורית': 'orit', 'קובי': 'kobi', 'אביב': 'aviv', 'יובל': 'yuval', 'עומר': 'omer' };
st.bdays = []; st.bdForm = null;
function bdAdmin() { return st.me && (st.me.id === 'kobi' || st.me.id === 'orit'); }
/* families — the board is grouped by these, in this order (names as on the board) */
var BD_FAMS = [
  { n: 'משפ׳ פז', c: '', m: ['אבא', 'אמא', 'אביב', 'יובל', 'עומר'] },
  { n: 'משפ׳ סטוצקי', c: '#7c3aed', m: ['סבא חנן', 'סבתא טובה'] },
  { n: 'משפ׳ פז', c: '#0f766e', m: ['סבא אלי', 'סבתא גליה'] },
  { n: 'משפ׳ ימנר', c: '#c2410c', m: ['רוני', 'רונן', 'עידו', 'רותם'] },
  { n: 'משפ׳ שבת', c: '#be185d', m: ['ניסים', 'טלי', 'רועי', 'שקד', 'נדב'] },
  { n: 'משפ׳ בנש', c: '#1d4ed8', m: ['אריאל', 'רינת', 'הדס', 'נוגה', 'שחר', 'שילה'] }
];
var BD_RENAME = { 'דודה טלי': 'טלי', 'דודה רוני': 'רוני', 'דודה רינת': 'רינת', 'נגה': 'נוגה' };
function bdFam(b) {   /* family index: chosen in the form (fam), else by name; -1 = אחרים */
  if (b.fam !== undefined && b.fam !== null && b.fam !== '') return +b.fam;
  for (var i = 0; i < BD_FAMS.length; i++) if (BD_FAMS[i].m.indexOf(b.title) >= 0) return i;
  return -1;
}
function bdColor(b) {
  var p = P[BD_WHO[b.title]]; if (p) return p.color;
  var f = BD_FAMS[bdFam(b)]; return f && f.c ? f.c : '#64748b';
}
/* once, from Kobi's device: rename to the names used on the family board */
function bdRename() {
  if (!st.me || st.me.id !== 'kobi' || !st.loaded || LS.get('bdRen1')) return;
  LS.set('bdRen1', '1');
  st.bdays.forEach(function (b) { if (BD_RENAME[b.title]) store.update(b.id, { title: BD_RENAME[b.title] }).catch(fail); });
}
function bdNext(md) {   /* {days, date, age-turning} until the next birthday (today = 0) */
  if (!md) return null;
  var m = +md.slice(0, 2), d = +md.slice(3, 5), now = new Date(), t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  function on(y) { var last = new Date(y, m, 0).getDate(); return new Date(y, m - 1, Math.min(d, last)); }
  var n = on(t0.getFullYear()); if (n < t0) n = on(t0.getFullYear() + 1);
  return { days: Math.round((n - t0) / 864e5), y: n.getFullYear() };
}
function bdDays(n) { return n === 0 ? '🎉 היום!' : n === 1 ? 'מחר!' : 'בעוד ' + n + ' ימים'; }
function bdSorted() {
  return st.bdays.slice().sort(function (a, b) {
    var x = bdNext(a.md), y = bdNext(b.md);
    return (x ? x.days : 9999) - (y ? y.days : 9999) || a.title.localeCompare(b.title, 'he');
  });
}
function patchStoreBday() {
  if (!store || store._bdPatched) return;
  store._bdPatched = true;
  var sub = store.subscribeTasks;
  store.subscribeTasks = function (lists, cb, err) {
    return sub.call(store, lists, function (tasks) {
      var seen = {}; st.bdays = tasks.filter(function (t) { if (!t.bday || seen[t.title]) return false; seen[t.title] = 1; return true; });
      cb(tasks.filter(function (t) { return !t.bday; }));
      bdSeed(); bdRename();
      if (st.active === 'bday' || st.active === 'home') renderList();
    }, err);
  };
}
var _startMainB = startMain;
startMain = function (p) { patchStoreBday(); _startMainB(p); };
if (st.me) startMain(st.me.id);
/* Kobi's device adds any name from the list that isn't on the board yet (once per list version) */
function bdSeed() {
  if (!st.me || st.me.id !== 'kobi' || !st.loaded || st._bdSeeding || +(LS.get('bdSeedV') || 0) >= BD_SEED.length) return;
  st._bdSeeding = true; LS.set('bdSeedV', String(BD_SEED.length));
  var have = {}; st.bdays.forEach(function (b) { have[b.title] = 1; });
  BD_SEED.forEach(function (r, i) {
    if (have[r[0]]) return;
    store.add({ bday: true, title: r[0], md: r[1], year: r[2], list: 'family', topic: '', done: false, due: '', time: '',
                createdBy: 'kobi', createdAt: Date.now() + i, doneBy: '', doneAt: 0, notes: [] }).catch(fail);
  });
  st._bdSeeding = false;
}
var _renderChipsB = renderChips;
renderChips = function () {
  _renderChipsB();
  if (!st.drawer || !st.me) return;
  var grp = null; document.querySelectorAll('#drawer .dsec').forEach(function (s) { if (s.textContent === 'קבוצות') grp = s; });
  if (!grp) return;
  var n = grp.nextElementSibling; while (n && n.classList.contains('drow')) n = n.nextElementSibling;
  var soon = st.bdays.filter(function (b) { var x = bdNext(b.md); return x && x.days <= 7; }).length;
  var tmp = document.createElement('div'); tmp.innerHTML = listRow(BDAY, soon);
  grp.parentNode.insertBefore(tmp.firstChild, n);
};
var _renderListB = renderList;
renderList = function () {
  if (st.active !== 'bday') return _renderListB.apply(this, arguments);
  var el = document.getElementById('list'); if (!el) return;
  var af = document.getElementById('addform'); if (af) af.style.display = 'none';
  bdSeed();
  var items = bdSorted();
  var h = '<div class="listhead"><div class="lh"><h1>🎂 ימי הולדת</h1></div>' + (bdAdmin() ? '<button class="btn exadd bdbtn" data-bd="new">+ יום הולדת</button>' : '') + '</div>';
  if (!items.length) h += '<div class="empty"><div class="big">🎂</div>אין עדיין ימי הולדת.</div>';
  function card(b) {
    var x = bdNext(b.md), age = x && b.year ? x.y - +b.year : 0;
    var badge = !x ? '' : x.days === 0 ? '<span class="bdbadge now">🎉</span>' : '<span class="bdbadge"><b>' + x.days + '</b>' + (x.days === 1 ? 'יום' : 'ימים') + '</span>';
    var sub = x ? (+b.md.slice(3)) + '.' + (+b.md.slice(0, 2)) + (age ? ' · ' + (x.days === 0 ? 'חוגג/ת ' : 'ימלאו ') + age : '') + (x.days === 0 ? ' · היום!' : x.days === 1 ? ' · מחר' : '')
                : (bdAdmin() ? 'הוספת תאריך' : 'אין תאריך');
    return '<button class="bdcard' + (x && x.days === 0 ? ' today' : x && x.days <= 7 ? ' soon' : '') + (x ? '' : ' nodate') + '" data-bd="' + b.id + '" style="--kc:' + bdColor(b) + '">' +
      '<span class="bdtop"><span class="bdic">🎂</span>' + badge + '</span>' +
      '<span class="bdname">' + esc(b.title) + '</span><span class="bddate">' + sub + '</span></button>';
  }
  var next = items.filter(function (b) { return b.md; })[0];
  if (next) { var nx = bdNext(next.md); h += '<div class="bdnext">🎈 הבא בתור: <b>' + esc(next.title) + '</b> · ' + bdDays(nx.days) + '</div>'; }
  var groups = BD_FAMS.map(function () { return []; }), other = [];
  st.bdays.forEach(function (b) { var f = bdFam(b); (f >= 0 && groups[f] ? groups[f] : other).push(b); });
  groups.forEach(function (g, i) {
    if (!g.length) return;
    var order = BD_FAMS[i].m;
    g.sort(function (a, b) { var x = order.indexOf(a.title), y = order.indexOf(b.title); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || a.title.localeCompare(b.title, 'he'); });
    h += '<div class="bdfam">' + esc(BD_FAMS[i].n) + '</div><div class="bdgrid">' + g.map(card).join('') + '</div>';
  });
  if (other.length) h += '<div class="bdfam">אחרים</div><div class="bdgrid">' + other.sort(function (a, b) { return a.title.localeCompare(b.title, 'he'); }).map(card).join('') + '</div>';
  el.innerHTML = h;
};
function bdOpen(id) {
  if (!bdAdmin()) return;
  var b = id && id !== 'new' ? st.bdays.filter(function (x) { return x.id === id; })[0] : null;
  st.bdForm = { id: b ? b.id : null, fam: b ? bdFam(b) : -1, title: b ? b.title : '', d: b && b.md ? +b.md.slice(3) : '', m: b && b.md ? +b.md.slice(0, 2) : '', year: b ? (b.year || '') : '' };
  bdDraw();
}
var MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
function bdDraw() {
  var f = st.bdForm, w = document.getElementById('bdwin');
  if (!f) { if (w) w.remove(); document.documentElement.classList.remove('nbopen'); return; }
  if (!w) { w = document.createElement('div'); w.id = 'bdwin'; w.className = 'exwinlike'; document.body.appendChild(w); }
  document.documentElement.classList.add('nbopen');
  var days = '<option value="">יום</option>'; for (var i = 1; i <= 31; i++) days += '<option' + (f.d === i ? ' selected' : '') + '>' + i + '</option>';
  var months = '<option value="">חודש</option>' + MONTHS.map(function (n, i) { return '<option value="' + (i + 1) + '"' + (f.m === i + 1 ? ' selected' : '') + '>' + n + '</option>'; }).join('');
  w.innerHTML = '<div class="nbback" data-bd-x="1"></div><div class="nbcard excard" role="dialog">' +
    '<div class="nbhead"><span class="nbic">🎂</span><span class="nbtitle">' + (f.id ? 'עריכת יום הולדת' : 'יום הולדת חדש') + '</span><button type="button" class="nbclose" data-bd-x="1">✕</button></div>' +
    '<div class="exlbl">שם</div><input class="inp" id="bdname" maxlength="40" value="' + esc(f.title) + '" placeholder="למשל: דודה טלי">' +
    '<div class="exlbl">משפחה</div><div class="exkids bdfams">' + BD_FAMS.map(function (fm, i) {
      return '<button type="button" class="' + (f.fam === i ? 'on' : '') + '" data-bd-fam="' + i + '" style="--kc:' + (fm.c || '#2f86f2') + '">' + esc(fm.n) + (i === 0 ? ' (שלנו)' : i === 2 ? ' (סבא וסבתא)' : '') + '</button>';
    }).join('') + '<button type="button" class="' + (f.fam === -1 ? 'on' : '') + '" data-bd-fam="-1" style="--kc:#64748b">אחר</button></div>' +
    '<div class="exlbl">תאריך</div><div class="bdsel"><select id="bdd">' + days + '</select><select id="bdm">' + months + '</select>' +
    '<input class="inp" id="bdy" inputmode="numeric" maxlength="4" placeholder="שנה (לא חובה)" value="' + esc(f.year) + '"></div>' +
    '<div class="nbact"><button type="button" class="btn" data-bd-save="1">שמירה</button><button type="button" class="btn soft" data-bd-x="1">ביטול</button>' +
    (f.id ? '<button type="button" class="btn danger ' + (st.sure === 'bd-' + f.id ? 'sure' : '') + '" data-bd-del="1">' + (st.sure === 'bd-' + f.id ? 'בטוח?' : '🗑') + '</button>' : '') + '</div></div>';
}
function bdGrab() {
  var f = st.bdForm; if (!f) return;
  f.title = document.getElementById('bdname').value; f.d = +document.getElementById('bdd').value || '';
  f.m = +document.getElementById('bdm').value || ''; f.year = document.getElementById('bdy').value.replace(/\D/g, '').slice(0, 4);
}
function bdSave() {
  bdGrab(); var f = st.bdForm, title = clean(f.title, 40);
  if (!title) return toast('כותבים שם ✏️');
  if ((f.d && !f.m) || (!f.d && f.m)) return toast('בוחרים גם יום וגם חודש');
  var md = f.d && f.m ? (f.m < 10 ? '0' : '') + f.m + '-' + (f.d < 10 ? '0' : '') + f.d : '';
  var data = { bday: true, title: title, md: md, year: f.year && f.year.length === 4 ? f.year : '', fam: f.fam };
  var id = f.id; st.bdForm = null; bdDraw();
  var p = id ? store.update(id, data) : store.add(Object.assign(data, { list: 'family', topic: '', done: false, due: '', time: '', createdBy: st.me.id, createdAt: Date.now(), doneBy: '', doneAt: 0, notes: [] }));
  p.then(function () { toast('🎂 ' + title + ' נשמר'); }).catch(fail);
}
document.addEventListener('click', function (e) {
  var t = e.target, b;
  if (st.active === 'bday' && (b = t.closest('[data-bd]'))) return bdOpen(b.getAttribute('data-bd'));
  if (!st.bdForm) return;
  if ((b = t.closest('[data-bd-fam]'))) { bdGrab(); st.bdForm.fam = +b.getAttribute('data-bd-fam'); return bdDraw(); }
  if (t.closest('[data-bd-save]')) return bdSave();
  if (t.closest('[data-bd-del]')) {
    var id = st.bdForm.id;
    if (st.sure !== 'bd-' + id) { bdGrab(); st.sure = 'bd-' + id; return bdDraw(); }
    st.sure = null; st.bdForm = null; bdDraw();
    return store.remove(id).then(function () { toast('🗑 נמחק'); }).catch(fail);
  }
  if (t.closest('[data-bd-x]')) { st.bdForm = null; st.sure = null; return bdDraw(); }
}, true);
