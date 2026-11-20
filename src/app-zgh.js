/* 💉 הורמון גדילה — monthly injection-site board. Fixed rule, nothing stored:
   day 1 of the month = יד ימין, 2 = יד שמאל, 3 = רגל ימין, 4 = רגל שמאל, 5 = יד ימין … (starts over every month).
   Seen by Kobi, Orit, Aviv and Yuval only. Read-only. */
var GHB = { id: 'gh', name: 'הורמון גדילה', color: '#4d7c0f', icon: '💉' };
L.gh = GHB;
var GH_WHO = ['kobi', 'orit', 'aviv', 'yuval'];
var GH_SITES = [
  { n: 'יד ימין', ic: '💪', c: '#2563eb' },
  { n: 'יד שמאל', ic: '💪', c: '#0891b2' },
  { n: 'רגל ימין', ic: '🦵', c: '#ea580c' },
  { n: 'רגל שמאל', ic: '🦵', c: '#b45309' }
];
var GH_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
st.ghOff = 0;
function ghAllowed() { return !!(st.me && GH_WHO.indexOf(st.me.id) >= 0); }
function ghSite(d) { return GH_SITES[(d.getDate() - 1) % 4]; }
var _renderChipsGH = renderChips;
renderChips = function () {
  _renderChipsGH();
  if (!st.drawer || !ghAllowed()) return;
  var grp = null; document.querySelectorAll('#drawer .dsec').forEach(function (s) { if (s.textContent === 'קבוצות') grp = s; });
  if (!grp) return;
  var n = grp.nextElementSibling; while (n && n.classList.contains('drow')) n = n.nextElementSibling;
  var tmp = document.createElement('div'); tmp.innerHTML = listRow(GHB, 0);
  grp.parentNode.insertBefore(tmp.firstChild, n);
};
var _renderListGH = renderList;
renderList = function () {
  if (st.active !== 'gh') return _renderListGH.apply(this, arguments);
  var el = document.getElementById('list'); if (!el) return;
  var af = document.getElementById('addform'); if (af) af.style.display = 'none';
  if (!ghAllowed()) { st.active = 'home'; return renderList(); }
  var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var first = new Date(now.getFullYear(), now.getMonth() + st.ghOff, 1), days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  var ts = ghSite(today);
  var h = '<div class="listhead"><div class="lh"><h1>💉 הורמון גדילה</h1></div></div>' +
    '<div class="ghtoday" style="--kc:' + ts.c + '"><span class="ghtl">היום · יום ' + WD[today.getDay()] + ' ' + today.getDate() + '.' + (today.getMonth() + 1) + '</span>' +
    '<span class="ghts">' + ts.ic + ' ' + ts.n + '</span></div>' +
    '<div class="ghnav"><button type="button" data-gh-m="-1" aria-label="החודש הקודם">›</button><b>' + GH_MONTHS[first.getMonth()] + ' ' + first.getFullYear() + '</b>' +
    '<button type="button" data-gh-m="1" aria-label="החודש הבא">‹</button></div>' +
    '<div class="ghkey">' + GH_SITES.map(function (s) { return '<span style="--kc:' + s.c + '"><i></i>' + s.n + '</span>'; }).join('') + '</div><div class="ghlist">';
  for (var i = 1; i <= days; i++) {
    var d = new Date(first.getFullYear(), first.getMonth(), i), s = ghSite(d), isT = +d === +today, past = d < today;
    h += '<div class="ghrow' + (isT ? ' today' : '') + (past ? ' past' : '') + (d.getDay() === 6 ? ' sat' : '') + '" style="--kc:' + s.c + '"' + (isT ? ' id="ghnow"' : '') + '>' +
      '<span class="ghinj">💉</span><span class="ghday">' + WD[d.getDay()] + '</span><span class="ghdate">' + i + '.' + (d.getMonth() + 1) + '</span>' +
      '<span class="ghsite">' + s.ic + ' ' + s.n + '</span>' + (isT ? '<span class="ghnow">היום</span>' : '') + '</div>';
  }
  el.innerHTML = h + '</div>';
};
document.addEventListener('click', function (e) {
  if (st.active !== 'gh') return;
  var b = e.target.closest && e.target.closest('[data-gh-m]'); if (!b) return;
  st.ghOff += +b.getAttribute('data-gh-m'); renderList();
});
/* opening the board starts on this month, scrolled to today */
var _startMainGH = startMain;
startMain = function (p) { st.ghOff = 0; _startMainGH(p); };
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-act="list"][data-id="gh"]'); if (!b) return;
  st.ghOff = 0;
  setTimeout(function () { var n = document.getElementById('ghnow'); if (n && n.scrollIntoView) n.scrollIntoView({ block: 'center' }); }, 80);
});
