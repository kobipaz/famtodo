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
