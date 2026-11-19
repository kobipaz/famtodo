/* Quick add from a link — used by the iPhone Shortcut "משימה חדשה" (Siri).
   https://kobipaz.github.io/famtodo/?add=<text>[&list=<id>]
   Understands היום / מחר / מחרתיים and "בשעה 10" / "בשעה 10:30" / "ב-17" inside the text. */
function parseQuick(s) {
  var r = { title: s, due: '', time: '' };
  var m = r.title.match(/(?:^|\s)(?:ב)?(?:שעה|-)\s*(\d{1,2})(?::(\d{2}))?(?=\s|$)/) || r.title.match(/(?:^|\s)ב(\d{1,2})(?::(\d{2}))(?=\s|$)/);
  if (m) {
    var h = +m[1], mi = m[2] ? +m[2] : 0;
    if (h >= 0 && h < 24 && mi < 60) { r.time = (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi; r.title = r.title.replace(m[0], ' '); }
  }
  var days = [['מחרתיים', 2], ['מחר', 1], ['היום', 0]];
  for (var i = 0; i < days.length; i++) {
    var re = new RegExp('(^|\\s)(?:ל|ב)?' + days[i][0] + '(?=\\s|$)');
    if (re.test(r.title)) { r.due = ymd(addDays(days[i][1])); r.title = r.title.replace(re, ' '); break; }
  }
  if (r.time && !r.due) r.due = ymd(addDays(0));
  r.title = r.title.replace(/\s+/g, ' ').trim();
  if (!r.title) r.title = s.trim();
  return r;
}
(function () {
  var q = new URLSearchParams(location.search), text = q.get('add');
  if (text) {
    LS.set('pendingAdd', JSON.stringify({ text: text, list: q.get('list') || '', at: Date.now() }));
    history.replaceState(null, '', location.pathname);
  }
  var tries = 0;
  (function wait() {
    var p; try { p = JSON.parse(LS.get('pendingAdd') || 'null'); } catch (e) { p = null; }
    if (!p) return;
    if (Date.now() - p.at > 15 * 60 * 1000) { LS.del('pendingAdd'); return; }
    if (!(st.me && st.loaded && st.screen === 'main')) { if (++tries < 600) setTimeout(wait, 400); return; }
    LS.del('pendingAdd');
    var list = st.lists.indexOf(p.list) >= 0 ? p.list : st.me.id;
    if (list === 'family' && !(st.me.id === 'kobi' || st.me.id === 'orit')) list = st.me.id;
    var r = parseQuick(String(p.text).slice(0, 300));
    var title = clean(r.title, 200); if (!title) return;
    st.justAdded = { title: title, at: Date.now() - 1500 };
    store.add({ list: list, title: title, due: r.due, time: r.time, topic: '', done: false, createdBy: st.me.id,
                createdAt: Date.now(), doneBy: '', doneAt: 0, notes: [] }).then(function () {
      toast('🎙 נוסף: ' + title + (r.due ? ' · ' + dueLabel(r.due).txt : '') + (r.time ? ' ' + r.time : ''));
      renderList();
    }).catch(fail);
  })();
})();
