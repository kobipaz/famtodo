/* Exam board: share + print — of the whole board ("כולם") or of one kid (whatever the filter shows).
   Upcoming exams only (from today on). */
function exListForOut() {
  return st.exams.filter(function (t) { return (st.exKid === 'all' || t.kid === st.exKid) && t.due && dayDiff(t.due) >= 0; })
    .sort(function (a, b) { return a.due.localeCompare(b.due) || String(a.kid).localeCompare(String(b.kid)); });
}
function exOutTitle() { return 'לוח מבחנים' + (st.exKid === 'all' ? '' : ' — ' + P[st.exKid].name); }
function exShare() {
  var items = exListForOut();
  if (!items.length) return toast('אין מבחנים קרובים לשתף');
  var lines = ['*📝 ' + exOutTitle() + '*', ''];
  items.forEach(function (t) {
    lines.push('*' + t.subject + (st.exKid === 'all' ? ' (' + P[t.kid].name + ')' : '') + '*');
    lines.push(exFmt(t.due));
    if (t.details && t.details.trim()) lines.push('חומר: ' + t.details.trim().replace(/\n+/g, ' · '));
    lines.push('');
  });
  var text = lines.join('\n').replace(/\n+$/, '');
  if (navigator.share) navigator.share({ text: text }).catch(function (e) { if (e && e.name !== 'AbortError') nbCopy(text); });
  else nbCopy(text);
}
/* iPhone home-screen app: window.print() does nothing there, so we draw the board as an A4 image
   and open the share sheet — it has "Print" (and save / send). */
function exIsIOSApp() { return window.navigator.standalone === true || (/iPhone|iPad|iPod/.test(navigator.userAgent) && window.matchMedia('(display-mode: standalone)').matches); }
function exBoardImage(items) {
  var all = st.exKid === 'all', W = 1240, M = 70, c = document.createElement('canvas'), x = c.getContext('2d');
  var FONT = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  var cols = all ? [{ k: 'date', w: 300, h: 'תאריך' }, { k: 'kid', w: 170, h: 'מי' }, { k: 'sub', w: 250, h: 'מקצוע' }, { k: 'det', w: 0, h: 'חומר למבחן' }]
                 : [{ k: 'date', w: 320, h: 'תאריך' }, { k: 'sub', w: 300, h: 'מקצוע' }, { k: 'det', w: 0, h: 'חומר למבחן' }];
  var used = cols.reduce(function (a, b) { return a + b.w; }, 0); cols[cols.length - 1].w = W - 2 * M - used;
  function wrap(t, w, f) { x.font = f; var out = []; String(t || '').split('\n').forEach(function (para) { var line = ''; para.split(' ').forEach(function (wd) { var tr = line ? line + ' ' + wd : wd; if (x.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; }); out.push(line); }); return out; }
  var rows = items.map(function (t) {
    var det = wrap(t.details || '', cols[cols.length - 1].w - 30, '26px ' + FONT);
    return { t: t, det: det, h: Math.max(78, 30 + det.length * 36) };
  });
  var H = Math.max(1754, M + 180 + 74 + rows.reduce(function (a, r) { return a + r.h; }, 0) + M);
  c.width = W; c.height = H;
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.direction = 'rtl'; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillStyle = '#111';
  x.font = 'bold 56px ' + FONT; x.fillText('📝 ' + exOutTitle(), W - M, M + 40);
  var now = new Date(); x.font = '26px ' + FONT; x.fillStyle = '#666';
  x.fillText('עודכן ' + now.getDate() + '.' + (now.getMonth() + 1) + '.' + String(now.getFullYear()).slice(2) + ' · FamToDo', W - M, M + 105);
  var y = M + 160, right = W - M;
  function rowLine(y0, h, head) {
    var xr = right;
    if (head) { x.fillStyle = '#eef0f4'; x.fillRect(M, y0, W - 2 * M, h); }
    x.strokeStyle = '#999'; x.lineWidth = 2; x.strokeRect(M, y0, W - 2 * M, h);
    cols.forEach(function (col, i) { xr -= col.w; if (i < cols.length - 1) { x.beginPath(); x.moveTo(xr, y0); x.lineTo(xr, y0 + h); x.stroke(); } });
  }
  rowLine(y, 74, true); x.fillStyle = '#111'; x.font = 'bold 28px ' + FONT;
  var xr = right; cols.forEach(function (col) { x.fillText(col.h, xr - 15, y + 37); xr -= col.w; });
  y += 74;
  rows.forEach(function (r) {
    rowLine(y, r.h, false); var t = r.t, xr = right, mid = y + 39;
    cols.forEach(function (col) {
      x.fillStyle = '#111';
      if (col.k === 'date') { x.font = '28px ' + FONT; x.fillText(exFmt(t.due), xr - 15, mid); }
      else if (col.k === 'kid') { x.fillStyle = P[t.kid].color; x.beginPath(); x.arc(xr - 26, mid, 10, 0, 7); x.fill(); x.fillStyle = '#111'; x.font = '28px ' + FONT; x.fillText(P[t.kid].name, xr - 46, mid); }
      else if (col.k === 'sub') { x.font = 'bold 30px ' + FONT; x.fillText(t.subject, xr - 15, mid); }
      else { x.font = '26px ' + FONT; x.fillStyle = '#333'; r.det.forEach(function (ln, i) { x.fillText(ln, xr - 15, y + 39 + i * 36); }); }
      xr -= col.w;
    });
    y += r.h;
  });
  var data = c.toDataURL('image/png'), bin = atob(data.split(',')[1]), arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], (st.exKid === 'all' ? 'לוח מבחנים' : 'לוח מבחנים - ' + P[st.exKid].name) + '.png', { type: 'image/png' });
}
function exPrint() {
  var items = exListForOut();
  if (!items.length) return toast('אין מבחנים קרובים להדפסה');
  if (exIsIOSApp()) {
    var file = exBoardImage(items);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      toast('בתפריט שנפתח בוחרים "הדפסה" 🖨');
      return navigator.share({ files: [file] }).catch(function () {});
    }
    var u = URL.createObjectURL(file); window.open(u, '_blank'); return;
  }
  var all = st.exKid === 'all';
  var old = document.getElementById('exprint'); if (old) old.remove();
  var d = document.createElement('div'); d.id = 'exprint';
  var now = new Date();
  d.innerHTML = '<h1>📝 ' + esc(exOutTitle()) + '</h1><div class="psub">עודכן ' + now.getDate() + '.' + (now.getMonth() + 1) + '.' + String(now.getFullYear()).slice(2) + ' · FamToDo</div>' +
    '<table><thead><tr><th>תאריך</th>' + (all ? '<th>מי</th>' : '') + '<th>מקצוע</th><th>חומר למבחן</th></tr></thead><tbody>' +
    items.map(function (t) {
      return '<tr><td class="pd">' + esc(exFmt(t.due)) + '</td>' +
        (all ? '<td><span class="pdot" style="background:' + P[t.kid].color + '"></span>' + esc(P[t.kid].name) + '</td>' : '') +
        '<td class="ps">' + esc(t.subject) + '</td><td class="pm">' + esc(t.details || '').replace(/\n/g, '<br>') + '</td></tr>';
    }).join('') + '</tbody></table>';
  document.body.appendChild(d);
  document.documentElement.classList.add('printing');
  var done = function () { document.documentElement.classList.remove('printing'); var e = document.getElementById('exprint'); if (e) e.remove(); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(function () { window.print(); setTimeout(done, 1500); }, 50);
}
var _renderListXP = renderList;
renderList = function () {
  var r = _renderListXP.apply(this, arguments);
  if (st.active === 'exams') {
    var add = document.querySelector('#list .exadd');
    if (add && !document.querySelector('#list .exout')) {
      add.insertAdjacentHTML('beforebegin', '<span class="exout">' +
        '<button type="button" class="exoutb" data-ex-share="1" aria-label="שיתוף">' + (typeof NB_SHARE_SVG !== 'undefined' ? NB_SHARE_SVG : '📤') + '</button>' +
        '<button type="button" class="exoutb" data-ex-print="1" aria-label="הדפסה">🖨</button></span>');
    }
  }
  return r;
};
document.addEventListener('click', function (e) {
  if (st.active !== 'exams') return;
  if (e.target.closest('[data-ex-share]')) { e.stopPropagation(); return exShare(); }
  if (e.target.closest('[data-ex-print]')) { e.stopPropagation(); return exPrint(); }
}, true);
