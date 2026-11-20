/* 🕘 Time wheel like the iPhone calendar: hours + minutes in 5-minute steps (00 05 10 … 55), plus typing by hand.
   The iPhone's own time picker ignores step (WebKit bug 215090), so every <input type="time"> in the app opens this
   wheel instead. On "אישור" the input gets the value and the usual input/change events, so every screen keeps working. */
var WH = null, WH_ROW = 40;
function whPad(n) { return (n < 10 ? '0' : '') + n; }
function whParse(v) {   /* "17:35", "1735", "9.05", "9" → "HH:MM" or '' */
  v = String(v || '').trim().replace(/[.,;\s]/g, ':');
  var m = v.match(/^(\d{1,2}):?(\d{2})?$/) || v.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return '';
  var h = +m[1], mi = m[2] === undefined ? 0 : +m[2];
  return h > 23 || mi > 59 ? '' : whPad(h) + ':' + whPad(mi);
}
function whCol(id, n, step) {
  var h = '<div class="whcol" id="' + id + '"><div class="whpad"></div>';
  for (var i = 0; i < n; i += step) h += '<div class="whit" data-v="' + i + '">' + whPad(i) + '</div>';
  return h + '<div class="whpad"></div></div>';
}
function whOpen(input) {
  var cur = input.value || '', now = new Date();
  var h = cur ? +cur.slice(0, 2) : now.getHours() + 1, m = cur ? +cur.slice(3, 5) : 0;
  WH = { input: input, h: h % 24, m: m, exact: cur && m % 5 ? cur : '' };
  var w = document.getElementById('whwin');
  if (!w) { w = document.createElement('div'); w.id = 'whwin'; document.body.appendChild(w); }
  w.innerHTML = '<div class="whback" data-wh-x="1"></div><div class="whcard" role="dialog">' +
    '<div class="whhead"><button type="button" class="whtxt" data-wh-x="1">ביטול</button><b>🕘 שעה</b><button type="button" class="whtxt whok" data-wh-ok="1">אישור</button></div>' +
    '<div class="whwheels"><div class="whband"></div>' + whCol('whh', 24, 1) + '<div class="whcolon">:</div>' + whCol('whm', 60, 5) + '</div>' +
    '<div class="whman"><span>או להקליד:</span><input id="whtext" type="text" inputmode="decimal" maxlength="5" placeholder="17:35" autocomplete="off" value="' + (WH.exact || '') + '"></div>' +
    (cur ? '<button type="button" class="whclear" data-wh-clear="1">בלי שעה</button>' : '') + '</div>';
  document.documentElement.classList.add('whopen');
  whScroll(WH.h, WH.m, false);
  ['whh', 'whm'].forEach(function (id) {
    var c = document.getElementById(id), tm = null;
    c.addEventListener('scroll', function () {
      clearTimeout(tm); tm = setTimeout(function () { whRead(); }, 90);
    });
  });
}
function whScroll(h, m, smooth) {
  var ch = document.getElementById('whh'), cm = document.getElementById('whm');
  if (!ch) return;
  var b = smooth ? 'smooth' : 'auto';
  ch.scrollTo({ top: h * WH_ROW, behavior: b }); cm.scrollTo({ top: Math.round(m / 5) % 12 * WH_ROW, behavior: b });
  whMark(h, Math.round(m / 5) % 12 * 5);
}
function whMark(h, m) {
  document.querySelectorAll('#whh .whit').forEach(function (e) { e.classList.toggle('on', +e.getAttribute('data-v') === h); });
  document.querySelectorAll('#whm .whit').forEach(function (e) { e.classList.toggle('on', +e.getAttribute('data-v') === m); });
}
function whRead() {
  if (!WH) return;
  var ch = document.getElementById('whh'), cm = document.getElementById('whm'); if (!ch) return;
  var h = Math.max(0, Math.min(23, Math.round(ch.scrollTop / WH_ROW))), m = Math.max(0, Math.min(11, Math.round(cm.scrollTop / WH_ROW))) * 5;
  if (WH.exact && (+WH.exact.slice(0, 2) !== h || Math.round(+WH.exact.slice(3, 5) / 5) * 5 % 60 !== m)) { WH.exact = ''; var tx = document.getElementById('whtext'); if (tx) tx.value = ''; }
  WH.h = h; WH.m = m; whMark(h, m);
}
function whClose() {
  var w = document.getElementById('whwin'); if (w) w.remove();
  document.documentElement.classList.remove('whopen'); WH = null;
}
function whSet(val) {
  var inp = WH.input; whClose();
  inp.value = val;
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  inp.dispatchEvent(new Event('change', { bubbles: true }));
  /* the task time sheet's "שעה אחרת" box: apply right away instead of waiting for "קביעה" */
  if (inp.id === 'timeman' && val) { var b = document.querySelector('[data-time-manual]'); if (b) b.click(); }
}
/* open the wheel instead of the phone's picker */
function whTap(e) {
  var t = e.target;
  if (!t || t.tagName !== 'INPUT' || t.type !== 'time' || t.disabled) return;
  e.preventDefault(); e.stopPropagation(); t.blur();
  if (!WH) whOpen(t);
}
document.addEventListener('touchend', whTap, { capture: true, passive: false });
document.addEventListener('mousedown', whTap, true);
document.addEventListener('click', function (e) { var t = e.target; if (t && t.tagName === 'INPUT' && t.type === 'time') { e.preventDefault(); if (!WH) whOpen(t); } }, true);
document.addEventListener('focusin', function (e) { var t = e.target; if (t && t.tagName === 'INPUT' && t.type === 'time') { t.blur(); if (!WH) whOpen(t); } }, true);
window.addEventListener('click', function (e) {
  if (!WH) return;
  var t = e.target;
  if (!t.closest || !t.closest('#whwin')) return;
  e.stopPropagation();
  var it = t.closest('.whit');
  if (it) { var col = it.parentNode.id, v = +it.getAttribute('data-v'); if (col === 'whh') WH.h = v; else WH.m = v; WH.exact = ''; return whScroll(WH.h, WH.m, true); }
  if (t.closest('[data-wh-ok]')) { whRead(); var typed = whParse((document.getElementById('whtext') || {}).value); return whSet(typed || WH.exact || whPad(WH.h) + ':' + whPad(WH.m)); }
  if (t.closest('[data-wh-clear]')) return whSet('');
  if (t.closest('[data-wh-x]')) return whClose();
}, true);
document.addEventListener('input', function (e) {
  if (!WH || !e.target || e.target.id !== 'whtext') return;
  var v = whParse(e.target.value);
  if (v) { WH.exact = v; WH.h = +v.slice(0, 2); WH.m = +v.slice(3, 5); whScroll(WH.h, WH.m, true); setTimeout(function () { if (WH) WH.exact = v; }, 400); }
});
document.addEventListener('keydown', function (e) {
  if (WH && e.key === 'Enter' && e.target && e.target.id === 'whtext') { e.preventDefault(); var ok = document.querySelector('[data-wh-ok]'); if (ok) ok.click(); }
});
