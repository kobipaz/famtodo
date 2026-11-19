/* Kobi & Orit: move a task to another list (e.g. from "קובי" to "אורית וקובי").
   Done as copy + delete, so it works with the current security rules. The people on the new
   list get the usual "new task" notification. */
function canMove() { return st.me && (st.me.id === 'kobi' || st.me.id === 'orit'); }
st.movePick = null;
var _taskHtmlM = taskHtml;
taskHtml = function (t) {
  var h = _taskHtmlM(t);
  if (!canMove() || t.archived || t.deleted) return h;
  h = h.replace(/<span class="lst" style="([^"]*)">([\s\S]*?)<\/span>/, function (m, sty, inner) {
    return '<button type="button" class="lst lstbtn" style="' + sty + '" data-move="' + t.id + '">' + inner + ' ▾</button>';
  });
  return h.replace('<button class="btn soft" data-act="archive"', '<button class="btn soft" data-move="' + t.id + '">↪️ העברה</button><button class="btn soft" data-act="archive"');
};
function listLabel(id) { var l = L[id]; return l.personal ? av(id, 'sm') : '<span class="tic">' + l.icon + '</span>'; }
var _renderPanelM = renderPanel;
renderPanel = function () {
  var el = document.getElementById('sheet');
  if (!st.movePick || !el) return _renderPanelM();
  var t = find(st.movePick); if (!t) { st.movePick = null; return _renderPanelM(); }
  var h = '<div class="sheet" data-move-close="1"><div class="panel tpanel" data-stop="1"><h3>↪️ העברה לרשימה</h3>' +
    '<div style="color:var(--muted);margin:-6px 2px 10px">' + esc(t.title) + '</div>' +
    st.lists.map(function (id) {
      var here = id === t.list;
      return '<button class="trow2 ' + (here ? 'on' : '') + '" ' + (here ? 'disabled' : 'data-move-to="' + id + '"') + '>' + listLabel(id) +
        '<span class="tt">' + esc(L[id].name) + (id === st.me.id ? ' (שלי)' : '') + '</span>' + (here ? '<span class="tl">כאן עכשיו</span>' : '') + '</button>';
    }).join('') +
    '<div class="actions"><button class="btn soft" data-move-close="1" style="flex:1">ביטול</button></div></div></div>';
  el.innerHTML = h;
};
function moveTask(id, to, quiet) {
  var t = find(id); if (!t || t.list === to) return Promise.resolve();
  var from = t.list;
  var copy = { list: to, title: t.title, due: t.due || '', time: t.time || '', topic: t.topic || '', done: false,
               createdBy: st.me.id, createdAt: Date.now(), doneBy: '', doneAt: 0, notes: (t.notes || []).slice() };
  return store.add(copy).then(function (ref) {
    var newId = (ref && ref.id) || copy.id;
    return store.remove(id).then(function () {
      if (quiet) return;
      if (st.open === id) st.open = newId;
      toast('↪️ הועבר ל' + L[to].name, 'ביטול', function () { moveTask(newId, from, true); });
    });
  }).catch(fail);
}
document.addEventListener('click', function (e) {
  var m = e.target.closest && e.target.closest('[data-move]');
  if (m) { e.preventDefault(); e.stopPropagation(); st.datePick = null; st.timePick = null; st.movePick = m.getAttribute('data-move'); return renderPanel(); }
  var to = e.target.closest && e.target.closest('[data-move-to]');
  if (to) { e.stopPropagation(); var id = st.movePick; st.movePick = null; renderPanel(); return moveTask(id, to.getAttribute('data-move-to')); }
  var c = e.target.closest && e.target.closest('[data-move-close]');
  if (c && (!e.target.closest('[data-stop]') || e.target.closest('button'))) { st.movePick = null; renderPanel(); }
}, true);
