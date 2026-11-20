/* ☰ menu: a clear split — "קבוצות" holds only the shared task lists (משפחתי, אורית וקובי, ילדים);
   the boards (מבחנים, חוגים, משימות קבועות, ימי הולדת, הורמון גדילה, אירועים משפחתיים) get their own "לוחות"
   section, in the same order as on the home screen, after the people's lists. */
if (L.exams) L.exams.name = 'מבחנים';   /* same name as on the home screen */
var BOARD_IDS = ['exams', 'chug', 'recur', 'bday', 'gh', 'events'];
var _renderChipsBD2 = renderChips;
renderChips = function () {
  _renderChipsBD2();
  if (!st.drawer) return;
  var panel = document.querySelector('#drawer .dpanel'); if (!panel) return;
  var rows = [];
  BOARD_IDS.forEach(function (id) {
    var r = panel.querySelector('.drow[data-id="' + id + '"]');
    if (r) { r.parentNode.removeChild(r); rows.push(r); }
  });
  if (!rows.length) return;
  var anchor = null;
  panel.querySelectorAll('.dsec').forEach(function (s) { if (s.textContent === 'ארכיון') anchor = s; });
  var sec = document.createElement('div'); sec.className = 'dsec'; sec.textContent = 'לוחות';
  var frag = document.createDocumentFragment(); frag.appendChild(sec); rows.forEach(function (r) { frag.appendChild(r); });
  if (anchor) panel.insertBefore(frag, anchor); else panel.appendChild(frag);
};
if (st.me && st.drawer) renderChips();
