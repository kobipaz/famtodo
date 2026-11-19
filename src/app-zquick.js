/* Quick add from a link — used by the iPhone Shortcut "משימה חדשה" (Siri).
   https://kobipaz.github.io/famtodo/?add=<text>[&list=<id>]
   Understands who (לאורית… / עבור אביב), topic (נושא קניות), day (היום/מחר/מחרתיים) and time
   (בשעה 10, בשעה 8 בערב, ב-17:30, 10 וחצי). */
/* Who: at the start ("לאורית לקנות חלב"), at the end ("…למשימות של אורית וקובי", "…לילדים"),
   or "עבור/בשביל X" anywhere. A single name at the end counts only after a day/time
   ("לבקר את אמא בשבת לאורית"), so "להתקשר לאורית" stays my own task. */
var QUICK_WHO = [['אורית וקובי', 'parents'], ['קובי ואורית', 'parents'], ['ההורים', 'parents'], ['הורים', 'parents'],
  ['המשפחה', 'family'], ['משפחה', 'family'], ['משפחתי', 'family'], ['הילדים', 'kids'], ['ילדים', 'kids'],
  ['אורית', 'orit'], ['קובי', 'kobi'], ['אביב', 'aviv'], ['יובל', 'yuval'], ['עומר', 'omer'], ['עצמי', 'me'], ['אותי', 'me']];
var QUICK_NUM = { 'אחת': 1, 'שתיים': 2, 'שתים': 2, 'שלוש': 3, 'ארבע': 4, 'חמש': 5, 'שש': 6, 'שבע': 7, 'שמונה': 8, 'תשע': 9, 'עשר': 10,
  'אחת עשרה': 11, 'אחת-עשרה': 11, 'שתים עשרה': 12, 'שתיים עשרה': 12, 'שתים-עשרה': 12 };
var QUICK_PART = { 'בבוקר': ['am', '09:00'], 'בצהריים': ['noon', '12:00'], 'אחר הצהריים': ['pm', '15:00'], 'אחרי הצהריים': ['pm', '15:00'],
  'אחה"צ': ['pm', '15:00'], 'אחה״צ': ['pm', '15:00'], 'בערב': ['pm', '18:00'], 'בלילה': ['pm', '21:00'] };
var QUICK_WD = { 'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6 };
function qEsc(x) { return x.replace(/[.*+?^${}()|[\]\\"״]/g, '\\$&'); }
function parseQuick(s) {
  var r = { title: ' ' + String(s).replace(/[.!?]+\s*$/, '') + ' ', due: '', time: '', list: '', topic: '' };
  var WHEN = /(מחר|היום|מחרתיים|שבת|ראשון|שני|שלישי|רביעי|חמישי|שישי|שעה|בבוקר|בערב|בלילה|צהריים|אחה|\d)/;
  /* recipient */
  for (var i = 0; i < QUICK_WHO.length && !r.list; i++) {
    var w = qEsc(QUICK_WHO[i][0]), id = QUICK_WHO[i][1], group = !P[id];
    var tries = [
      [new RegExp('^\\s*ל' + w + '[\\s,:]'), true],
      [new RegExp('\\s(?:עבור|בשביל|ברשימה של|לרשימה של|ברשימת|לרשימת|למשימות של|במשימות של)\\s+' + w + '(?=[\\s,.]|$)'), true],
      [new RegExp('\\sל' + w + '\\s*$'), 'end']
    ];
    for (var k = 0; k < tries.length; k++) {
      var mt = r.title.match(tries[k][0]); if (!mt) continue;
      if (tries[k][1] === 'end' && !group && !WHEN.test(r.title.slice(0, mt.index))) continue;
      r.list = id; r.title = r.title.replace(tries[k][0], ' '); break;
    }
  }
  /* topic: "נושא קניות" / "בנושא רפואי" */
  var tm = r.title.match(/\s(?:ב)?נושא\s+(\S+(?:\s\S+)?)/);
  if (tm) {
    var hit = TOPICS.filter(function (t) { return tm[1].indexOf(t.name) === 0; })[0];
    if (hit) { r.topic = hit.id; r.title = r.title.replace(new RegExp('\\s(?:ב)?נושא\\s+' + qEsc(hit.name)), ' '); }
  }
  /* time: number ("בשעה 10", "ב-17:30", "ב10:30") or words ("בחמש", "בשעה שמונה וחצי"), + part of day */
  var parts = Object.keys(QUICK_PART).map(qEsc).join('|');
  var nums = Object.keys(QUICK_NUM).sort(function (a, b) { return b.length - a.length; }).map(qEsc).join('|');
  var re = new RegExp('\\s(?:בשעה\\s*|שעה\\s*|ב-?\\s*)(\\d{1,2}(?::\\d{2})?|' + nums + ')(\\s+(?:וחצי|ורבע))?(\\s+(?:' + parts + '))?(?=\\s)');
  var m = r.title.match(re);
  if (m && /^\d{1,2}$/.test(m[1]) && !/שעה|-/.test(m[0]) && !m[2] && !m[3]) m = null;   /* "ב5" alone is too vague */
  if (m) {
    var hm = /^\d/.test(m[1]) ? m[1].split(':') : [String(QUICK_NUM[m[1]]), ''];
    var h = +hm[0], mi = hm[1] ? +hm[1] : (m[2] ? (m[2].indexOf('חצי') >= 0 ? 30 : 15) : 0);
    var part = m[3] ? QUICK_PART[m[3].trim()][0] : '';
    if (h < 12 && part === 'pm') h += 12;
    if (part === 'noon' && h < 6) h += 12;
    if (!part && !m[1].includes(':') && /^\d/.test(m[1]) === false && h < 7) h += 12;   /* "בחמש" → 17:00 */
    if (h >= 0 && h < 24 && mi < 60) { r.time = (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi; r.title = r.title.replace(m[0], ' '); }
  } else {
    /* only a part of day ("בשבת אחר הצהריים") → the app's preset time */
    var pm = r.title.match(new RegExp('\\s(' + parts + ')(?=\\s)'));
    if (pm) { r.time = QUICK_PART[pm[1]][1]; r.title = r.title.replace(pm[0], ' '); }
  }
  /* day: היום / מחר / מחרתיים / (ב|ל)(יום) שבת / ביום שלישי … */
  var ms = r.title.match(/\s(?:ב|ל)?מוצאי\s+שבת(?=\s)/);           /* "במוצאי שבת" → Saturday, 20:00 if no time given */
  if (ms) { r.due = ymd(addDays((6 - new Date().getDay() + 7) % 7)); if (!r.time) r.time = '20:00'; r.title = r.title.replace(ms[0], ' '); }
  var days = [['מחרתיים', 2], ['מחר', 1], ['היום', 0]];
  for (var d = 0; d < days.length && !r.due; d++) {
    var rd = new RegExp('\\s(?:ל|ב)?' + days[d][0] + '(?=\\s)');
    if (rd.test(r.title)) { r.due = ymd(addDays(days[d][1])); r.title = r.title.replace(rd, ' '); break; }
  }
  if (!r.due) {
    var wm = r.title.match(/\s(?:ב|ל)?יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)(?:\s+הקרוב)?(?=\s)/) || r.title.match(/\s(?:ב|ל)(שבת|שישי)(?:\s+הקרוב(?:ה)?)?(?=\s)/);
    if (wm) { var ahead = (QUICK_WD[wm[1]] - new Date().getDay() + 7) % 7; r.due = ymd(addDays(ahead)); r.title = r.title.replace(wm[0], ' '); }
  }
  var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  var tMin = r.time ? +r.time.slice(0, 2) * 60 + +r.time.slice(3) : 0;
  if (r.time && !r.due) r.due = ymd(addDays(tMin <= nowMin ? 1 : 0));          /* time only: today, or tomorrow if passed */
  r.title = r.title.replace(/\s+/g, ' ').replace(/^[\s,:-]+|[\s,:-]+$/g, '').trim();
  if (!r.title) r.title = String(s).trim();
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
