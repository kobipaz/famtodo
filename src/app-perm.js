/* Only Kobi & Orit may delete tasks (also enforced in firestore.rules).
   Kids can still archive (swipe right). */
var DELETERS = ['kobi', 'orit'];
function canDelete() { return !!(st.me && DELETERS.indexOf(st.me.id) >= 0); }
var _doDelete = doDelete;
doDelete = function (id) {
  if (!canDelete()) { renderList(); toast('רק אורית וקובי יכולים למחוק. אפשר להעביר לארכיון ➡️'); return; }
  _doDelete(id);
};
var _taskHtml = taskHtml;
taskHtml = function (t) {
  var h = _taskHtml(t);
  if (!canDelete()) {
    h = h.replace(/<button class="btn danger[^"]*" data-act="del"[^>]*>[\s\S]*?<\/button>/, '')
         .replace('<span class="sw-l">🗑 מחיקה</span>', '<span class="sw-l">🚫 רק אורית וקובי מוחקים</span>');
  }
  return h;
};

/* "משפחתי": everyone sees it, only Kobi & Orit add tasks there */
var PARENT_ONLY_ADD = ['family'];
function canAddTo(listId) { return canDelete() || PARENT_ONLY_ADD.indexOf(listId) < 0; }
var _renderList = renderList;
renderList = function () {
  _renderList();
  if (!st.me || st.active === 'archive') return;
  var af = document.getElementById('addform'), el = document.getElementById('list');
  var blocked = !canAddTo(st.active);
  if (af) af.style.display = blocked ? 'none' : '';
  if (blocked && el && st.loaded) el.insertAdjacentHTML('beforeend', '<div class="demo" style="background:#eef4fd;color:#3b5b85">👀 כאן רק אורית וקובי מוסיפים משימות. אפשר לסמן "בוצע" ולהוסיף הערות.</div>');
};
var _addTask = addTask;
addTask = function () { if (!canAddTo(st.active === 'all' ? st.me.id : st.active)) return toast('רק אורית וקובי מוסיפים משימות כאן'); _addTask(); };

/* "משפחתי": only Kobi & Orit move tasks to/from the archive */
function canArchive(t) { return canDelete() || !t || t.list !== 'family'; }
var _doArchive = doArchive;
doArchive = function (id, on) {
  var t = find(id);
  if (!canArchive(t)) { renderList(); toast('ב"משפחתי" רק אורית וקובי מעבירים לארכיון'); return; }
  _doArchive(id, on);
};
var _taskHtml2 = taskHtml;
taskHtml = function (t) {
  var h = _taskHtml2(t);
  if (!canArchive(t)) {
    h = h.replace(/<button class="btn soft" data-act="(un)?archive"[^>]*>[\s\S]*?<\/button>/, '')
         .replace(/<span class="sw-r">[\s\S]*?<\/span>/, '<span class="sw-r">🚫 רק אורית וקובי</span>');
  }
  return h;
};

/* Orit also sees (and can edit) Kobi's personal list — mirrored in firestore.rules */
if (ACCESS.orit.indexOf('kobi') < 0) ACCESS.orit.splice(ACCESS.orit.indexOf('kids') + 1, 0, 'kobi');
if (st.me && st.me.id === 'orit') startMain('orit');
