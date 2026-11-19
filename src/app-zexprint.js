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
function exPrint() {
  var items = exListForOut();
  if (!items.length) return toast('אין מבחנים קרובים להדפסה');
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
