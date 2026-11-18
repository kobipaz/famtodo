/* Apple-Reminders-style "when" pills: a separate 📅 date pill and 🕒 time pill.
   The date pill opens a quick menu (today, tomorrow, weekend, next week, pick a date). */
st.datePick = null;
function addDays(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; }
function dm(d) { return d.getDate() + '/' + (d.getMonth() + 1); }
function dateQuick() {
  var wd = new Date().getDay();                    // 0 = Sunday
  var toFri = (5 - wd + 7) % 7 || 7, toSun = (7 - wd) % 7 || 7;
  var a = [['☀️', 'היום', addDays(0)], ['🌅', 'מחר', addDays(1)], ['📆', 'מחרתיים', addDays(2)]];
  if (toFri > 2) a.push(['🛋', 'סוף השבוע', addDays(toFri)]);
  a.push(['🗓', 'שבוע הבא', addDays(toSun)]);
  return a;
}
function pillDateTxt(v) { var dl = dueLabel(v); return dl ? dl.txt : ''; }
/* new-task bar + edit mode: separate pills, no ✕ (clearing is inside each menu) */
dateChip = function (value, dataId, emptyTxt) {
  return '<button type="button" class="opt pill ' + (value ? 'on' : '') + '" data-date-pick="' + dataId + '">📅 ' + (value ? pillDateTxt(value) : 'תאריך') + '</button>';
};
timeChip = function (val, target) {
  return '<button type="button" class="opt pill ' + (val ? 'on' : '') + '" data-time-pick="' + target + '">🕒 ' + (val || 'שעה') + '</button>';
};
/* task card: two pills instead of one "📅 date · time" chip */
var _taskHtmlW = taskHtml;
taskHtml = function (t) {
  var h = _taskHtmlW(t);
  if (t.done || t.archived || !t.due) return h;
  var dl = dueLabel(t.due);
  return h.replace(/<button type="button" class="due ([^"]*)" data-time-pick="[^"]*">[\s\S]*?<\/button>/, function (m, cls) {
    return '<span class="whenp">' +
      '<button type="button" class="wp ' + cls + '" data-date-pick="' + t.id + '">📅 ' + dl.txt + '</button>' +
      '<button type="button" class="wp ' + (t.time ? cls : 'empty') + '" data-time-pick="' + t.id + '"' + (t.time ? '' : ' aria-label="הוספת שעה"') + '>🕒' + (t.time ? ' ' + t.time : '') + '</button></span>';
  });
};
function applyDate(target, val) {
  st.datePick = null;
  if (target === 'new') {
    st.newDue = val; if (!val) st.newTime = ''; renderOpts();
  } else if (target === 'edit') {
    st.editDue = val; renderList();
  } else {
    var t = find(target); if (!t) return renderPanel();
    var patch = { due: val }; if (!val) patch.time = '';
    Object.assign(t, patch);
    if (st.editing === target) st.editDue = val;
    renderList();
    store.update(target, patch).then(function () { toast(val ? '📅 הועבר ל' + pillDateTxt(val) : 'התאריך הוסר'); }).catch(fail);
  }
  renderPanel();
}
var _renderPanelW = renderPanel;
renderPanel = function () {
  var el = document.getElementById('sheet');
  if (!st.datePick || !el) return _renderPanelW();
  var tgt = st.datePick, t = (tgt !== 'new' && tgt !== 'edit') ? find(tgt) : null;
  var cur = tgt === 'new' ? st.newDue : tgt === 'edit' ? st.editDue : ((t || {}).due || '');
  var h = '<div class="sheet" data-date-close="1"><div class="panel tpanel" data-stop="1"><h3>📅 תאריך</h3>' +
    (t ? '<div style="color:var(--muted);margin:-6px 2px 10px">למשימה: ' + esc(t.title) + '</div>' : '') +
    dateQuick().map(function (q) {
      var v = ymd(q[2]);
      return '<button class="trow2 ' + (cur === v ? 'on' : '') + '" data-date-set="' + v + '" data-date-target="' + tgt + '"><span class="tic">' + q[0] + '</span><span class="tt">' + q[1] + '</span><span class="tl">יום ' + WD[q[2].getDay()] + ' · ' + dm(q[2]) + '</span></button>';
    }).join('') +
    '<button class="trow2 ' + (!cur ? 'on' : '') + '" data-date-set="" data-date-target="' + tgt + '"><span class="tic">🚫</span><span class="tt">ללא תאריך</span></button>' +
    '<label class="tman dman"><span>📅 תאריך אחר…</span><input type="date" id="dateman" data-date-target="' + tgt + '" value="' + esc(cur) + '"></label>' +
    '<div class="actions"><button class="btn soft" data-date-close="1" style="flex:1">סגירה</button></div></div></div>';
  el.innerHTML = h;
};
document.addEventListener('click', function (e) {
  var t = e.target;
  var pick = t.closest && t.closest('[data-date-pick]');
  if (pick) { e.preventDefault(); e.stopPropagation(); st.timePick = null; st.datePick = pick.getAttribute('data-date-pick'); return renderPanel(); }
  var set = t.closest && t.closest('[data-date-set]');
  if (set) { e.stopPropagation(); return applyDate(set.getAttribute('data-date-target'), set.getAttribute('data-date-set')); }
  var cl = t.closest && t.closest('[data-date-close]');
  if (cl && (!t.closest('[data-stop]') || t.closest('button'))) { st.datePick = null; renderPanel(); }
}, true);
document.addEventListener('change', function (e) {
  if (e.target && e.target.id === 'dateman') { e.stopPropagation(); if (e.target.value) applyDate(e.target.getAttribute('data-date-target'), e.target.value); }
}, true);
if (st.me && st.screen === 'main') { renderOpts(); renderList(); }
