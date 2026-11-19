/* Quick add from a link — used by the iPhone Shortcut "משימה חדשה" (Siri).
   https://kobipaz.github.io/famtodo/?add=<text>[&list=<id>]
   Understands who (לאורית… / עבור אביב), topic (נושא קניות), day (היום/מחר/מחרתיים) and time
   (בשעה 10, בשעה 8 בערב, ב-17:30, 10 וחצי). */
/* Who: at the start ("לאורית לקנות חלב"), or "עבור/בשביל/ברשימה של X" anywhere.
   ("להתקשר לאורית" stays a task for me — "לאורית" in the middle is not a recipient.) */
var QUICK_WHO = [['אורית וקובי', 'parents'], ['קובי ואורית', 'parents'], ['ההורים', 'parents'], ['הורים', 'parents'],
  ['המשפחה', 'family'], ['משפחה', 'family'], ['משפחתי', 'family'], ['הילדים', 'kids'], ['ילדים', 'kids'],
  ['אורית', 'orit'], ['קובי', 'kobi'], ['אביב', 'aviv'], ['יובל', 'yuval'], ['עומר', 'omer'], ['עצמי', 'me'], ['אותי', 'me']];
function parseQuick(s) {
  var r = { title: ' ' + s + ' ', due: '', time: '', list: '', topic: '' };
  /* recipient */
  for (var i = 0; i < QUICK_WHO.length && !r.list; i++) {
    var w = QUICK_WHO[i][0];
    var res = [new RegExp('^\\s*ל' + w + '[\\s,:]'), new RegExp('\\s(?:עבור|בשביל|ברשימה של|לרשימה של|ברשימת|לרשימת)\\s+' + w + '(?=[\\s,.]|$)')];
    for (var k = 0; k < res.length; k++) if (res[k].test(r.title)) { r.list = QUICK_WHO[i][1]; r.title = r.title.replace(res[k], ' '); break; }
  }
  /* topic: "נושא קניות" / "בנושא רפואי" */
  var tm = r.title.match(/\s(?:ב)?נושא\s+(\S+(?:\s\S+)?)/);
  if (tm) {
    var hit = TOPICS.filter(function (t) { return tm[1].indexOf(t.name) === 0; })[0];
    if (hit) { r.topic = hit.id; r.title = r.title.replace(new RegExp('\\s(?:ב)?נושא\\s+' + hit.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), ' '); }
  }
  /* time: "בשעה 10", "בשעה 10:30", "ב-17", "ב10:30", "10 וחצי", + בבוקר/בצהריים/אחר הצהריים/בערב/בלילה */
  var m = r.title.match(/\s(?:ב)?(?:שעה|-)\s*(\d{1,2})(?::(\d{2}))?(\s+(?:וחצי|ורבע))?(?=\s)/) || r.title.match(/\sב(\d{1,2}):(\d{2})(?=\s)/);
  if (m) {
    var h = +m[1], mi = m[2] ? +m[2] : (m[3] ? (m[3].indexOf('חצי') >= 0 ? 30 : 15) : 0);
    var rest = r.title.slice(r.title.indexOf(m[0]) + m[0].length);
    var pm = rest.match(/^\s*(בערב|בלילה|אחר הצהריים|אחרי הצהריים|אחה"צ|אחה״צ|בצהריים|בבוקר)(?=\s)/);
    if (pm) {
      if (h < 12 && /ערב|לילה|צהריים|אחה/.test(pm[1]) && !(pm[1] === 'בצהריים' && h >= 11)) h += 12;
      if (h === 24) h = 0;
      r.title = r.title.replace(m[0] + pm[0], ' ');
    } else r.title = r.title.replace(m[0], ' ');
    if (h >= 0 && h < 24 && mi < 60) r.time = (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi;
  }
  /* day */
  var days = [['מחרתיים', 2], ['מחר', 1], ['היום', 0]];
  for (var d = 0; d < days.length; d++) {
    var re = new RegExp('\\s(?:ל|ב)?' + days[d][0] + '(?=\\s)');
    if (re.test(r.title)) { r.due = ymd(addDays(days[d][1])); r.title = r.title.replace(re, ' '); break; }
  }
  if (r.time && !r.due) {                       /* time without a day: today, or tomorrow if that time already passed */
    var now = new Date(), passed = +r.time.slice(0, 2) * 60 + +r.time.slice(3) <= now.getHours() * 60 + now.getMinutes();
    r.due = ymd(addDays(passed ? 1 : 0));
  }
  r.title = r.title.replace(/\s+/g, ' ').replace(/^[\s,:-]+|[\s,:-]+$/g, '').trim();
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
    var r = parseQuick(String(p.text).slice(0, 300));
    var want = r.list === 'me' ? st.me.id : (r.list || p.list);
    var list = st.lists.indexOf(want) >= 0 ? want : st.me.id;
    if (list === 'family' && !(st.me.id === 'kobi' || st.me.id === 'orit')) list = st.me.id;
    var denied = want && want !== list;
    var title = clean(r.title, 200); if (!title) return;
    st.justAdded = { title: title, at: Date.now() - 1500 };
    store.add({ list: list, title: title, due: r.due, time: r.time, topic: r.topic, done: false, createdBy: st.me.id,
                createdAt: Date.now(), doneBy: '', doneAt: 0, notes: [] }).then(function () {
      toast('🎙 נוסף' + (list !== st.me.id ? ' ל' + L[list].name : '') + ': ' + title + (r.due ? ' · ' + dueLabel(r.due).txt : '') + (r.time ? ' ' + r.time : '') +
            (denied ? ' (לרשימה שלך — אין הרשאה ל' + (L[want] ? L[want].name : want) + ')' : ''));
      renderList();
    }).catch(fail);
  })();
})();
