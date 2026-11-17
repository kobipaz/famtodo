/* Recycle bin: deleting moves a task to the deleter's own bin (deleted:true). From the bin: restore,
   delete forever, or empty the bin. Only Kobi & Orit can delete (enforced in firestore.rules). */
var TRASH_DAYS = 14;   /* the bin empties itself after 14 days (scripts/notify.py) */
var TRASH = { id: 'trash', name: 'סל מחזור', color: '#8b5a5a', icon: '🗑' };
L.trash = TRASH;
st.trashAll = [];
function myTrash() { return st.trashAll.filter(function (t) { return t.deletedBy === (st.me && st.me.id); }).sort(function (a, b) { return (b.deletedAt || 0) - (a.deletedAt || 0); }); }
/* keep deleted tasks out of every normal view */
function patchStoreTrash() {
  if (!store || store._trashPatched) return;
  store._trashPatched = true;
  var sub = store.subscribeTasks;
  store.subscribeTasks = function (lists, cb, err) {
    return sub.call(store, lists, function (tasks) {
      st.trashAll = tasks.filter(function (t) { return t.deleted; });
      cb(tasks.filter(function (t) { return !t.deleted; }));
    }, err);
  };
}
var _startMainTr = startMain;
startMain = function (p) { patchStoreTrash(); _startMainTr(p); };
if (st.me) startMain(st.me.id);
/* delete = move to my bin (with undo) */
doDelete = function (id) {
  if (!canDelete()) { renderList(); toast('רק אורית וקובי יכולים למחוק. אפשר להעביר לארכיון ➡️'); return; }
  var t = find(id); if (!t) return;
  var patch = { deleted: true, deletedAt: Date.now(), deletedBy: st.me.id };
  st.tasks = st.tasks.filter(function (x) { return x.id !== id; }); st.open = null; renderChips(); renderList();
  store.update(id, patch).catch(fail);
  toast('🗑 הועבר לסל המחזור', 'ביטול', function () { store.update(id, { deleted: false }).catch(fail); });
};
/* drawer: bin row for Kobi & Orit */
var _renderChipsTr = renderChips;
renderChips = function () {
  _renderChipsTr();
  if (!st.drawer || !canDelete()) return;
  var arch = document.querySelector('#drawer .drow[data-id="archive"]');
  if (arch) arch.insertAdjacentHTML('afterend', listRow(TRASH, myTrash().length));
};
function daysLeftTxt(at) {
  var left = Math.ceil(((at || 0) + TRASH_DAYS * 864e5 - Date.now()) / 864e5);
  return left <= 1 ? 'היום/מחר' : 'בעוד ' + left + ' ימים';
}
/* bin view */
var _renderListTr = renderList;
renderList = function () {
  if (st.active !== 'trash') return _renderListTr();
  var el = document.getElementById('list'); if (!el) return;
  var af = document.getElementById('addform'); if (af) af.style.display = 'none';
  var items = myTrash();
  var h = '<div class="listhead"><div class="lh"><h1>🗑 סל מחזור</h1><small>מתרוקן לבד אחרי ' + TRASH_DAYS + ' ימים</small></div>' +
    (items.length ? '<button class="btn danger ' + (st.sure === 'emptybin' ? 'sure' : '') + '" data-bin="empty">' + (st.sure === 'emptybin' ? 'למחוק הכל לצמיתות?' : 'ריקון הסל') + '</button>' : '') + '</div>';
  if (!items.length) h += '<div class="empty"><div class="big">🗑</div>הסל ריק.</div>';
  items.forEach(function (t) {
    var lt = L[t.list] || {};
    h += '<div class="task bin"><div class="binrow"><div class="tbody"><div class="ttitle">' + esc(t.title) + '</div>' +
      '<div class="tmeta"><span class="lst" style="background:' + (lt.color || '#888') + '">' + (lt.icon ? lt.icon + ' ' : '') + esc(lt.name || '') + '</span><span class="who">נמחקה ' + when(t.deletedAt) + ' · תימחק לצמיתות ' + daysLeftTxt(t.deletedAt) + '</span></div></div>' +
      '<div class="binacts"><button class="btn soft" data-bin="restore" data-id="' + t.id + '">↩️ שחזור</button>' +
      '<button class="btn danger ' + (st.sure === 'bin-' + t.id ? 'sure' : '') + '" data-bin="kill" data-id="' + t.id + '">' + (st.sure === 'bin-' + t.id ? 'בטוח?' : 'מחיקה') + '</button></div></div></div>';
  });
  el.innerHTML = h;
};
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-bin]'); if (!b) return;
  e.stopPropagation();
  var act = b.getAttribute('data-bin'), id = b.getAttribute('data-id');
  if (act === 'restore') {
    store.update(id, { deleted: false }).then(function () { toast('↩️ המשימה שוחזרה'); }).catch(fail);
  } else if (act === 'kill') {
    if (st.sure !== 'bin-' + id) { askSure('bin-' + id); return renderList(); }
    st.sure = null; store.remove(id).catch(fail);
  } else if (act === 'empty') {
    if (st.sure !== 'emptybin') { askSure('emptybin'); return renderList(); }
    st.sure = null;
    var ids = myTrash().map(function (t) { return t.id; });
    Promise.all(ids.map(function (x) { return store.remove(x); })).then(function () { toast('🗑 הסל רוקן'); }).catch(fail);
  }
}, true);
