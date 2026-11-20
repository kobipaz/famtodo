/* 🏅 Activities board — a livelier, clearer view: a "today" card at the top, then the week as day cards
   with an icon tile per activity (time · activity · who), then changing dates. Same data and editing as before. */
var CH_ICON = [['תופים', '🥁'], ['כדורסל', '🏀'], ['כדורגל', '⚽'], ['אנגלית', '🔤'], ['הגנה', '🥋'], ['כושר', '🏋️'],
  ['צופים', '⛺'], ['מתמטיקה', '➗'], ['תזמורת', '🎺'], ['הוראה', '📚'], ['נבחרת', '🏆'], ['שחייה', '🏊'], ['ריקוד', '💃'],
  ['גיטרה', '🎸'], ['פסנתר', '🎹'], ['שירה', '🎤'], ['ציור', '🎨'], ['טניס', '🎾'], ['דורית', '👩‍🏫']];
function chIcon(t) { for (var i = 0; i < CH_ICON.length; i++) if (String(t || '').indexOf(CH_ICON[i][0]) >= 0) return CH_ICON[i][1]; return '🏅'; }
function chTile(c, time, extra) {
  var p = P[c.who] || {};
  return '<button class="cvtile" data-ch="' + c.id + '" style="--kc:' + (p.color || '#888') + '">' +
    '<span class="cvic">' + chIcon(c.title) + '</span>' +
    '<span class="cvtx"><span class="cvname">' + esc(c.title) + '</span>' +
    '<span class="cvwho"><i></i>' + esc(p.name || '') + (extra ? ' · ' + extra : '') + '</span></span>' +
    '<span class="cvtime">' + esc(time || '—') + '</span></button>';
}
function chDayRows(mine, d, ymdStr) {
  var rows = [];
  mine.forEach(function (c) {
    if (c.mode !== 'var') (c.slots || []).forEach(function (s) { if (+s.d === d) rows.push({ c: c, t: s.t || '' }); });
    else (c.dates || []).forEach(function (x) { if (x.date === ymdStr) rows.push({ c: c, t: x.t || '' }); });
  });
  return rows.sort(function (a, b) { return (a.t || '99').localeCompare(b.t || '99'); });
}
var _renderListCV = renderList;
renderList = function () {
  var r = _renderListCV.apply(this, arguments);
  if (st.active !== 'chug') return r;
  var el = document.getElementById('list'); if (!el) return r;
  /* keep the header (with share / print / + חוג) and the person filter, redraw the rest */
  var keep = [];
  Array.prototype.forEach.call(el.children, function (ch) { if (ch.classList.contains('listhead') || ch.classList.contains('exkids')) keep.push(ch); });
  var mine = st.chugs.filter(function (c) { return st.chWho === 'all' || c.who === st.chWho; });
  var h = '';
  if (!mine.length) h = '<div class="empty"><div class="big">🏅</div>אין עדיין חוגים.' + (chAdmin() ? '<br>לוחצים על "+ חוג".' : '') + '</div>';
  else {
    var now = new Date(), wd = now.getDay(), today = chDayRows(mine, wd, ymd(addDays(0)));
    var nowT = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    h += '<div class="cvhero"><div class="cvhh"><b>היום</b> · יום ' + WD[wd] + '</div>' +
      (today.length ? today.map(function (x) {
        var p = P[x.c.who] || {}, past = x.t && x.t < nowT;
        return '<button class="cvhrow' + (past ? ' past' : '') + '" data-ch="' + x.c.id + '"><span class="cvht">' + esc(x.t || '—') + '</span>' +
          '<span class="cvhic">' + chIcon(x.c.title) + '</span><span class="cvhn">' + esc(x.c.title) + '</span>' +
          '<span class="cvhw" style="--kc:' + (p.color || '#888') + '">' + esc(p.name || '') + '</span></button>';
      }).join('') : '<div class="cvnone">אין חוגים היום 🎈</div>') + '</div>';
    for (var i = 1; i < 7; i++) {
      var d = (wd + i) % 7, rows = chDayRows(mine, d, ymd(addDays(i)));
      if (!rows.length) continue;
      h += '<div class="cvday"><div class="cvdh"><span>יום ' + WD[d] + '</span>' + (i === 1 ? '<em>מחר</em>' : '') + '<small>' + rows.length + (rows.length === 1 ? ' חוג' : ' חוגים') + '</small></div>' +
        '<div class="cvgrid">' + rows.map(function (x) { return chTile(x.c, x.t); }).join('') + '</div></div>';
    }
    var td = ymd(addDays(0)), lim = ymd(addDays(7)), vs = [];
    mine.forEach(function (c) { if (c.mode === 'var') (c.dates || []).forEach(function (x) { if (x.date >= lim) vs.push({ c: c, date: x.date, t: x.t || '' }); }); });
    vs.sort(function (a, b) { return (a.date + a.t).localeCompare(b.date + b.t); });
    if (vs.length) h += '<div class="cvday"><div class="cvdh"><span>🗓 מועדים בהמשך</span></div><div class="cvgrid">' + vs.slice(0, 12).map(function (x) { return chTile(x.c, x.t, chDateFmt(x.date)); }).join('') + '</div></div>';
    var noTime = mine.filter(function (c) { return c.mode === 'var' ? !(c.dates || []).some(function (x) { return x.date >= td; }) : !(c.slots || []).length; });
    if (noTime.length) h += '<div class="cvday"><div class="cvdh"><span>בלי מועד קרוב</span></div><div class="cvgrid">' + noTime.map(function (c) { return chTile(c, ''); }).join('') + '</div></div>';
  }
  el.innerHTML = ''; keep.forEach(function (k) { el.appendChild(k); });
  el.insertAdjacentHTML('beforeend', h);
  return r;
};
if (st.me && st.screen === 'main' && st.active === 'chug') renderList();
