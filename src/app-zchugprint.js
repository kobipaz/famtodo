/* Activities board: share + print (everyone, or one person — whatever the filter shows).
   On the iPhone home-screen app print = an A4 image through the share sheet (it has "Print"). */
function chOut() {
  var mine = st.chugs.filter(function (c) { return st.chWho === 'all' || c.who === st.chWho; }), rows = [];
  for (var d = 0; d < 7; d++) mine.forEach(function (c) { if (c.mode !== 'var') (c.slots || []).forEach(function (s) { if (+s.d === d) rows.push({ when: 'יום ' + WD[d], t: s.t || '', c: c, k: '0' + d + (s.t || '') }); }); });
  var td = ymd(addDays(0));
  mine.forEach(function (c) { if (c.mode === 'var') (c.dates || []).forEach(function (x) { if (x.date >= td) rows.push({ when: chDateFmt(x.date), t: x.t || '', c: c, k: '1' + x.date + (x.t || ''), v: true }); }); });
  rows.sort(function (a, b) { return a.k.localeCompare(b.k); });
  return rows;
}
function chTitle() { return 'חוגים' + (st.chWho === 'all' ? '' : ' — ' + P[st.chWho].name); }
function chShare() {
  var rows = chOut(); if (!rows.length) return toast('אין חוגים לשתף');
  var all = st.chWho === 'all', lines = ['*🏅 ' + chTitle() + '*'], last = '';
  rows.forEach(function (r) {
    var head = r.v ? 'מועדים משתנים' : r.when;
    if (head !== last) { lines.push('', '*' + head + '*'); last = head; }
    lines.push((r.v ? r.when + ' · ' : '') + (r.t ? r.t + ' ' : '') + r.c.title + (all ? ' (' + P[r.c.who].name + ')' : ''));
  });
  var text = lines.join('\n');
  if (navigator.share) navigator.share({ text: text }).catch(function (e) { if (e && e.name !== 'AbortError') nbCopy(text); });
  else nbCopy(text);
}
function chImage(rows) {
  var all = st.chWho === 'all', W = 1240, M = 70, c = document.createElement('canvas'), x = c.getContext('2d');
  var FONT = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  var cols = all ? [{ k: 'when', w: 330, h: 'יום' }, { k: 't', w: 160, h: 'שעה' }, { k: 'n', w: 0, h: 'חוג' }, { k: 'who', w: 220, h: 'מי' }]
                 : [{ k: 'when', w: 360, h: 'יום' }, { k: 't', w: 180, h: 'שעה' }, { k: 'n', w: 0, h: 'חוג' }];
  var used = cols.reduce(function (a, b) { return a + b.w; }, 0); cols.forEach(function (q) { if (!q.w) q.w = W - 2 * M - used; });
  var RH = 70, H = Math.max(1754, M + 234 + rows.length * RH + M);
  c.width = W; c.height = H; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.direction = 'rtl'; x.textAlign = 'right'; x.textBaseline = 'middle';
  x.fillStyle = '#111'; x.font = 'bold 56px ' + FONT; x.fillText('🏅 ' + chTitle(), W - M, M + 40);
  var now = new Date(); x.font = '26px ' + FONT; x.fillStyle = '#666';
  x.fillText('עודכן ' + now.getDate() + '.' + (now.getMonth() + 1) + '.' + String(now.getFullYear()).slice(2) + ' · FamToDo', W - M, M + 105);
  var y = M + 160;
  function grid(y0, h, head) {
    if (head) { x.fillStyle = '#eef0f4'; x.fillRect(M, y0, W - 2 * M, h); }
    x.strokeStyle = '#999'; x.lineWidth = 2; x.strokeRect(M, y0, W - 2 * M, h);
    var xr = W - M; cols.forEach(function (q, i) { xr -= q.w; if (i < cols.length - 1) { x.beginPath(); x.moveTo(xr, y0); x.lineTo(xr, y0 + h); x.stroke(); } });
  }
  grid(y, 74, true); x.fillStyle = '#111'; x.font = 'bold 28px ' + FONT;
  var xr = W - M; cols.forEach(function (q) { x.fillText(q.h, xr - 15, y + 37); xr -= q.w; }); y += 74;
  var lastWhen = '';
  rows.forEach(function (r) {
    grid(y, RH, false); var xr = W - M, mid = y + RH / 2;
    cols.forEach(function (q) {
      x.fillStyle = '#111'; x.font = '28px ' + FONT;
      if (q.k === 'when') { if (r.when !== lastWhen) { x.font = 'bold 28px ' + FONT; x.fillText(r.when, xr - 15, mid); } }
      else if (q.k === 't') x.fillText(r.t || '—', xr - 15, mid);
      else if (q.k === 'n') { x.font = 'bold 30px ' + FONT; x.fillText(r.c.title, xr - 15, mid); }
      else { x.fillStyle = P[r.c.who].color; x.beginPath(); x.arc(xr - 26, mid, 10, 0, 7); x.fill(); x.fillStyle = '#111'; x.fillText(P[r.c.who].name, xr - 46, mid); }
      xr -= q.w;
    });
    lastWhen = r.when; y += RH;
  });
  var data = c.toDataURL('image/png'), bin = atob(data.split(',')[1]), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], chTitle().replace(' — ', ' - ') + '.png', { type: 'image/png' });
}
function chPrint() {
  var rows = chOut(); if (!rows.length) return toast('אין חוגים להדפסה');
  if (exIsIOSApp()) {
    var file = chImage(rows);
    if (navigator.canShare && navigator.canShare({ files: [file] })) { toast('בתפריט שנפתח בוחרים "הדפסה" 🖨'); return navigator.share({ files: [file] }).catch(function () {}); }
    return window.open(URL.createObjectURL(file), '_blank');
  }
  var all = st.chWho === 'all', old = document.getElementById('exprint'); if (old) old.remove();
  var d = document.createElement('div'); d.id = 'exprint'; var now = new Date(), last = '';
  d.innerHTML = '<h1>🏅 ' + esc(chTitle()) + '</h1><div class="psub">עודכן ' + now.getDate() + '.' + (now.getMonth() + 1) + '.' + String(now.getFullYear()).slice(2) + ' · FamToDo</div>' +
    '<table><thead><tr><th>יום</th><th>שעה</th><th>חוג</th>' + (all ? '<th>מי</th>' : '') + '</tr></thead><tbody>' +
    rows.map(function (r) { var w = r.when !== last ? esc(r.when) : ''; last = r.when;
      return '<tr><td class="pd">' + w + '</td><td>' + esc(r.t || '—') + '</td><td class="ps">' + esc(r.c.title) + '</td>' +
        (all ? '<td><span class="pdot" style="background:' + P[r.c.who].color + '"></span>' + esc(P[r.c.who].name) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table>';
  document.body.appendChild(d); document.documentElement.classList.add('printing');
  var done = function () { document.documentElement.classList.remove('printing'); var e = document.getElementById('exprint'); if (e) e.remove(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(function () { window.print(); setTimeout(done, 1500); }, 50);
}
var _renderListCP = renderList;
renderList = function () {
  var r = _renderListCP.apply(this, arguments);
  if (st.active === 'chug' && st.chugs.length) {
    var head = document.querySelector('#list .listhead');
    if (head && !head.querySelector('.exout')) {
      var tgt = head.querySelector('.chbtn');
      var html = '<span class="exout"><button type="button" class="exoutb" data-ch-share="1" aria-label="שיתוף">' + (typeof NB_SHARE_SVG !== 'undefined' ? NB_SHARE_SVG : '📤') + '</button>' +
        '<button type="button" class="exoutb" data-ch-print="1" aria-label="הדפסה">🖨</button></span>';
      if (tgt) tgt.insertAdjacentHTML('beforebegin', html); else head.insertAdjacentHTML('beforeend', html);
    }
  }
  return r;
};
document.addEventListener('click', function (e) {
  if (st.active !== 'chug') return;
  if (e.target.closest('[data-ch-share]')) { e.stopPropagation(); return chShare(); }
  if (e.target.closest('[data-ch-print]')) { e.stopPropagation(); return chPrint(); }
}, true);
