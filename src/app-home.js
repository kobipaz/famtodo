/* Home view on every open (Kobi/Orit: all tasks, kids: own list) + kids see only what they archived */
function isAdminP(id) { return id === 'kobi' || id === 'orit'; }
function homeList(person) { return isAdminP(person) ? 'all' : person; }
function inMyArchive(t) { return t.archived && (isAdminP(st.me.id) || t.archivedBy === st.me.id); }
var _startMainH = startMain;
startMain = function (person) { LS.set('list_' + person, homeList(person)); _startMainH(person); };
archivedCount = function () { return st.tasks.filter(inMyArchive).length; };
var _renderListH = renderList;
renderList = function () {
  if (!st.me || st.active !== 'archive' || isAdminP(st.me.id)) return _renderListH.apply(this, arguments);
  var all = st.tasks;
  st.tasks = all.filter(function (t) { return !t.archived || inMyArchive(t); });
  try { return _renderListH.apply(this, arguments); } finally { st.tasks = all; }
};
if (st.me) startMain(st.me.id);

/* Back to the home view after a while in the background */
var HOME_AFTER_MS = 5 * 60 * 1000;
var _hiddenAt = 0;
function goHome() {
  if (!st.me || st.screen !== 'main' || st.editing) return;
  var home = homeList(st.me.id);
  st.drawer = false; st.open = null;
  if (st.panel) { st.panel = false; renderPanel(); }
  if (st.active !== home) { st.active = home; LS.set('list_' + st.me.id, home); }
  renderChips(); renderList(); window.scrollTo(0, 0);
}
document.addEventListener('visibilitychange', function () {
  if (document.hidden) { _hiddenAt = Date.now(); return; }
  if (_hiddenAt && Date.now() - _hiddenAt >= HOME_AFTER_MS) goHome();
  _hiddenAt = 0;
});
window.addEventListener('pageshow', function (e) { if (e.persisted) goHome(); });
