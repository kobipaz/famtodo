/* 🏡 Home screen: big inviting tiles — everyone's list, the groups, and the boards
   (exams, activities, repeating tasks, birthdays). The app opens here; ☰ → "בית" or the logo returns here. */
var HOME = { id: 'home', name: 'בית', color: '#0f172a', icon: '🏡' };
L.home = HOME;
homeList = function () { return 'home'; };
function hmToday(list) { return st.tasks.filter(function (t) { return !t.done && !t.archived && t.list === list && t.due && dayDiff(t.due) <= 0; }).length; }
function hmOpen(list) { return st.tasks.filter(function (t) { return !t.done && !t.archived && t.list === list; }).length; }
function hmTile(id, icon, name, sub, color, big, extra) {
  return '<button class="hmtile' + (big ? ' big' : '') + '" data-act="list" data-id="' + id + '" style="--kc:' + color + '">' +
    '<span class="hmic">' + icon + '</span><span class="hmname">' + esc(name) + '</span>' + (sub ? '<span class="hmsub">' + sub + '</span>' : '') + (extra || '') + '</button>';
}
function hmCount(id) {
  var n = hmOpen(id), d = hmToday(id);
  return n ? n + ' משימות' + (d ? ' · <b>' + d + ' להיום</b>' : '') : 'אין משימות פתוחות 🎉';
}
var _renderListH2 = renderList;
renderList = function () {
  if (st.active !== 'home') return _renderListH2.apply(this, arguments);
  var el = document.getElementById('list'); if (!el) return;
  var af = document.getElementById('addform'); if (af) af.style.display = 'none';
  var me = st.me.id, people = st.lists.filter(function (id) { return L[id].personal; }), groups = st.lists.filter(function (id) { return !L[id].personal; });
  people.sort(function (a, b) { return (a === me ? -1 : 0) - (b === me ? -1 : 0); });
  var hr = new Date().getHours(), hi = hr < 12 ? 'בוקר טוב' : hr < 17 ? 'צהריים טובים' : hr < 21 ? 'ערב טוב' : 'לילה טוב';
  var h = '<div class="hmhello">' + hi + ', ' + esc(P[me].name) + ' 👋</div>';
  h += '<div class="hmsec">המשפחה</div><div class="hmgrid">' + people.map(function (id) {
    return hmTile(id, '<span class="hmav" style="background:' + P[id].color + '">' + esc(P[id].name.charAt(0)) + '</span>', P[id].name + (id === me ? ' (שלי)' : ''), hmCount(id), P[id].color, id === me);
  }).join('') + '</div>';
  h += '<div class="hmsec">קבוצות</div><div class="hmgrid">' + groups.map(function (id) { return hmTile(id, L[id].icon, L[id].name, hmCount(id), L[id].color); }).join('') +
    (me === 'kobi' || me === 'orit' ? hmTile('all', '📋', 'כל המשימות', '', '#14213d') : '') + '</div>';
  /* boards */
  var ex = (st.exams || []).filter(function (t) { return t.due && dayDiff(t.due) >= 0; }).sort(function (a, b) { return a.due.localeCompare(b.due); })[0];
  var exSub = ex ? esc(ex.subject) + ' (' + esc(P[ex.kid].name) + ') · ' + exLeft(ex.due).t : 'אין מבחנים קרובים';
  var wd = new Date().getDay(), chToday = (st.chugs || []).reduce(function (n, c) { return n + (c.mode !== 'var' ? (c.slots || []).filter(function (s) { return +s.d === wd; }).length : (c.dates || []).filter(function (x) { return x.date === ymd(addDays(0)); }).length); }, 0);
  var chSub = (st.chugs || []).length ? (chToday ? chToday + ' חוגים היום' : 'אין חוגים היום') : 'עוד אין חוגים';
  var rc = st.tasks.filter(function (t) { return t.repeat && !t.archived && t.due && dayDiff(t.due) <= 0; }).length;
  var rcSub = rc ? rc + ' להיום' : (st.tasks.some(function (t) { return t.repeat; }) ? 'הכל בוצע להיום ✔' : 'עוד אין');
  var bd = (typeof bdSorted === 'function' ? bdSorted() : []).filter(function (b) { return b.md; })[0], bn = bd ? bdNext(bd.md) : null;
  var bdSub = bd ? esc(bd.title) + ' · ' + bdDays(bn.days) : 'אין תאריכים';
  h += '<div class="hmsec">לוחות</div><div class="hmgrid">' +
    hmTile('exams', '📝', 'מבחנים', exSub, L.exams.color) + hmTile('chug', '🏅', 'חוגים', chSub, L.chug.color) +
    hmTile('recur', '🔁', 'משימות קבועות', rcSub, L.recur.color) + hmTile('bday', '🎂', 'ימי הולדת', bdSub, L.bday.color) +
    (typeof evUp === 'function' ? hmTile('events', '🎉', 'אירועים משפחתיים', evSub(), L.events.color, true) : '') + '</div>';
  el.innerHTML = h;
};
function evSub() {
  var e = evUp().filter(function (x) { return x.due; })[0];
  return e ? esc(e.title) + ' · ' + exLeft(e.due).t : (st.events.length ? st.events.length + ' אירועים · עוד בלי תאריך' : 'עוד אין אירועים');
}
/* drawer: "בית" first */
var _renderChipsH2 = renderChips;
renderChips = function () {
  _renderChipsH2();
  if (!st.drawer) return;
  var first = document.querySelector('#drawer .drow');
  if (first) first.insertAdjacentHTML('beforebegin', listRow(HOME, 0));
};
/* logo / app name → home */
document.addEventListener('click', function (e) {
  if (!st.me || st.screen !== 'main') return;
  if (e.target.closest && e.target.closest('header .logo, header .wordmark')) { st.active = 'home'; st.open = null; renderChips(); renderList(); window.scrollTo(0, 0); }
});
if (st.me && st.screen === 'main') { st.active = 'home'; renderChips(); renderList(); }
