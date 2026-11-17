/* Task time: preset times (morning/noon/afternoon/evening/night) or a typed time.
   Stored as t.time = 'HH:MM'. A time without a date means today. notify.py sends a reminder at that time. */
var TIME_PRESETS = [['09:00', 'בוקר'], ['12:00', 'צהריים'], ['15:00', 'אחר הצהריים'], ['18:00', 'ערב'], ['21:00', 'לילה']];
st.newTime = ''; st.timePick = null;
function todayYmd() { return ymd(new Date()); }
/* sort: date, then time (timed first within a day), then newest */
byDue = function (a, b) {
  if (a.due && b.due) {
    if (a.due !== b.due) return a.due < b.due ? -1 : 1;
    var at = a.time || '99', bt = b.time || '99';
    if (at !== bt) return at < bt ? -1 : 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  }
  if (a.due) return -1;
  if (b.due) return 1;
  return (b.createdAt || 0) - (a.createdAt || 0);
};
function timeChip(val, target, emptyTxt) {
  return '<button type="button" class="opt ' + (val ? 'on' : '') + '" data-time-pick="' + target + '">🕘 ' + (val || emptyTxt) + '</button>' +
    (val ? '<button type="button" class="opt clr" data-time-set="" data-time-target="' + target + '" aria-label="ניקוי שעה">✕</button>' : '');
}
/* new-task row: time chip next to the date chip */
var _renderOptsT = renderOpts;
renderOpts = function () {
  _renderOptsT();
  var b = document.querySelector('#opts [data-act="picktopic"]');
  if (b) b.insertAdjacentHTML('beforebegin', timeChip(st.newTime, 'new', 'שעה'));
};
/* task card: date chip shows the time and opens the time menu; edit mode gets a time chip */
var _taskHtmlT = taskHtml;
taskHtml = function (t) {
  var h = _taskHtmlT(t);
  if (!t.done && !t.archived) {
    var dl = dueLabel(t.due);
    if (dl) h = h.replace(/<span class="due ([^"]*)">📅 ([^<]*)<\/span>/, function (m, cls, txt) {
      return '<button type="button" class="due ' + cls + '" data-time-pick="' + t.id + '">📅 ' + txt + (t.time ? ' · ' + t.time : '') + '</button>';
    });
  }
  if (st.editing === t.id) h = h.replace('<button type="button" class="opt" data-act="picktopic" data-id="edit">', timeChip(t.time || '', t.id, 'שעה') + '<button type="button" class="opt" data-act="picktopic" data-id="edit">');
  return h;
};
var _addTaskT = addTask;
addTask = function () {
  var tm = st.newTime;
  if (tm && !st.newDue) st.newDue = todayYmd();
  if (store && !store._timePatched) {
    var add = store.add; store._timePatched = true;
    store.add = function (t) { if (st._pendingTime) { t.time = st._pendingTime; st._pendingTime = ''; } return add.call(store, t); };
  }
  st._pendingTime = tm;
  _addTaskT();
  if (st._pendingTime === '') { st.newTime = ''; renderOpts(); } else st._pendingTime = '';
};
function applyTime(target, val) {
  st.timePick = null;
  if (target === 'new') {
    st.newTime = val; if (val && !st.newDue) st.newDue = todayYmd(); renderOpts();
  } else {
    var t = find(target); if (!t) return renderPanel();
    var patch = { time: val }; if (val && !t.due) patch.due = todayYmd();
    Object.assign(t, patch);
    if (st.editing === target && patch.due) st.editDue = patch.due;
    renderList();
    store.update(target, patch).then(function () { if (val) toast('🕘 נקבע ' + (patch.due ? 'להיום ב-' : 'ל-') + val); }).catch(fail);
  }
  renderPanel();
}
/* time menu (bottom sheet) */
var _renderPanelTm = renderPanel;
renderPanel = function () {
  var el = document.getElementById('sheet');
  if (!st.timePick || !el) return _renderPanelTm();
  var tgt = st.timePick, cur = tgt === 'new' ? st.newTime : ((find(tgt) || {}).time || '');
  var t = tgt !== 'new' ? find(tgt) : null;
  var h = '<div class="sheet" data-time-close="1"><div class="panel tpanel" data-stop="1"><h3>🕘 שעה</h3>' +
    (t ? '<div style="color:var(--muted);margin:-6px 2px 10px">למשימה: ' + esc(t.title) + '</div>' : '') +
    '<button class="trow2 ' + (!cur ? 'on' : '') + '" data-time-set="" data-time-target="' + tgt + '"><span class="tt">ללא שעה</span></button>' +
    TIME_PRESETS.map(function (p) {
      return '<button class="trow2 ' + (cur === p[0] ? 'on' : '') + '" data-time-set="' + p[0] + '" data-time-target="' + tgt + '"><span class="tic">🕘</span><span class="tt">' + p[0] + '</span><span class="tl">' + p[1] + '</span></button>';
    }).join('') +
    '<div class="tman"><span>שעה אחרת:</span><input type="time" id="timeman" value="' + esc(cur) + '"><button class="btn" data-time-manual="' + tgt + '">קביעה</button></div>' +
    '<div class="actions"><button class="btn soft" data-time-close="1" style="flex:1">סגירה</button></div></div></div>';
  el.innerHTML = h;
};
document.addEventListener('click', function (e) {
  var t = e.target;
  var pick = t.closest && t.closest('[data-time-pick]');
  if (pick) { e.stopPropagation(); st.timePick = pick.getAttribute('data-time-pick'); return renderPanel(); }
  var set = t.closest && t.closest('[data-time-set]');
  if (set) { e.stopPropagation(); return applyTime(set.getAttribute('data-time-target'), set.getAttribute('data-time-set')); }
  var man = t.closest && t.closest('[data-time-manual]');
  if (man) {
    var v = (document.getElementById('timeman') || {}).value || '';
    if (!/^\d{2}:\d{2}$/.test(v)) return toast('בחרו שעה');
    return applyTime(man.getAttribute('data-time-manual'), v);
  }
  var cl = t.closest && t.closest('[data-time-close]');
  if (cl && (!t.closest('[data-stop]') || t.closest('button'))) { st.timePick = null; renderPanel(); }
}, true);
