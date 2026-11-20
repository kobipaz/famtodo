/* 🕘 Task time sheet: quick presets, then pick an hour and minutes in 10-minute steps (00 10 20 30 40 50),
   or type any time by hand (17:35, 1735, 9.05). Replaces the phone's minute wheel. */
st.tg = null;
var TG_QUICK = [['09:00', 'בוקר'], ['12:00', 'צהריים'], ['15:00', 'אחה״צ'], ['18:00', 'ערב'], ['21:00', 'לילה']];
function tgPad(n) { return (n < 10 ? '0' : '') + n; }
function tgParse(v) {   /* "17:35", "1735", "9.05", "9" → "HH:MM" or '' */
  v = String(v || '').trim().replace(/[.,;\s]/g, ':');
  var m = v.match(/^(\d{1,2}):?(\d{2})?$/) || v.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return '';
  var h = +m[1], mi = m[2] === undefined ? 0 : +m[2];
  if (h > 23 || mi > 59) return '';
  return tgPad(h) + ':' + tgPad(mi);
}
function tgVal() { return st.tg && st.tg.h !== null ? tgPad(st.tg.h) + ':' + tgPad(st.tg.m || 0) : ''; }
function tgSync(fromText) {   /* update highlights, preview and the hidden value without redrawing (keeps the keyboard open) */
  var v = tgVal(), hid = document.getElementById('timeman'); if (hid) hid.value = v;
  document.querySelectorAll('#sheet [data-tg-h]').forEach(function (b) { b.classList.toggle('on', st.tg.h !== null && +b.getAttribute('data-tg-h') === st.tg.h); });
  document.querySelectorAll('#sheet [data-tg-m]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-tg-m') === st.tg.m); });
  document.querySelectorAll('#sheet .tgq').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-time-set') === v); });
  var pv = document.getElementById('tgprev'); if (pv) pv.textContent = v || '--:--';
  var ok = document.getElementById('tgok'); if (ok) ok.disabled = !v;
  if (!fromText) { var tx = document.getElementById('tgtext'); if (tx) tx.value = v; }
}
var _renderPanelTG = renderPanel;
renderPanel = function () {
  var el = document.getElementById('sheet');
  if (!st.timePick || !el) { st.tg = null; return _renderPanelTG(); }
  var tgt = st.timePick, t = tgt !== 'new' ? find(tgt) : null, cur = tgt === 'new' ? st.newTime : ((t || {}).time || '');
  if (!st.tg || st.tg.tgt !== tgt) st.tg = { tgt: tgt, h: cur ? +cur.slice(0, 2) : null, m: cur ? +cur.slice(3, 5) : 0 };
  var hours = []; for (var i = 6; i < 30; i++) hours.push(i % 24);
  el.innerHTML = '<div class="sheet" data-time-close="1"><div class="panel tpanel tgpanel" data-stop="1"><h3>🕘 שעה</h3>' +
    (t ? '<div class="tgfor">למשימה: ' + esc(t.title) + '</div>' : '') +
    '<div class="tgquick"><button class="tgq ' + (!cur ? 'on' : '') + '" data-time-set="" data-time-target="' + tgt + '">ללא שעה</button>' +
      TG_QUICK.map(function (p) { return '<button class="tgq ' + (cur === p[0] ? 'on' : '') + '" data-time-set="' + p[0] + '" data-time-target="' + tgt + '"><b>' + p[0] + '</b>' + p[1] + '</button>'; }).join('') + '</div>' +
    '<div class="tglbl">שעה</div><div class="tghours">' + hours.map(function (h) { return '<button type="button" data-tg-h="' + h + '">' + tgPad(h) + '</button>'; }).join('') + '</div>' +
    '<div class="tglbl">דקות</div><div class="tgmins">' + [0, 10, 20, 30, 40, 50].map(function (m) { return '<button type="button" data-tg-m="' + m + '">' + tgPad(m) + '</button>'; }).join('') + '</div>' +
    '<div class="tgman"><span>או להקליד:</span><input id="tgtext" type="text" inputmode="decimal" maxlength="5" placeholder="17:35" autocomplete="off"><input type="hidden" id="timeman"></div>' +
    '<div class="actions"><button class="btn tgok" id="tgok" data-time-manual="' + tgt + '"><span id="tgprev">--:--</span> · קביעה</button><button class="btn soft" data-time-close="1">סגירה</button></div></div></div>';
  tgSync();
};
/* on window (runs before the sheet's own click handler, which would treat any button as "close") */
window.addEventListener('click', function (e) {
  if (!st.tg || !st.timePick) return;
  var b = e.target.closest && e.target.closest('[data-tg-h],[data-tg-m]'); if (!b) return;
  e.stopPropagation();
  if (b.hasAttribute('data-tg-h')) { st.tg.h = +b.getAttribute('data-tg-h'); if (st.tg.m === null) st.tg.m = 0; }
  else { st.tg.m = +b.getAttribute('data-tg-m'); if (st.tg.h === null) st.tg.h = new Date().getHours(); }
  tgSync();
}, true);
document.addEventListener('input', function (e) {
  if (!st.tg || !e.target || e.target.id !== 'tgtext') return;
  var v = tgParse(e.target.value);
  if (v) { st.tg.h = +v.slice(0, 2); st.tg.m = +v.slice(3, 5); }
  else if (!e.target.value) { st.tg.h = null; st.tg.m = 0; }
  tgSync(true);
  if (!v && e.target.value) { var hid = document.getElementById('timeman'); if (hid) hid.value = ''; var ok = document.getElementById('tgok'); if (ok) ok.disabled = true; document.getElementById('tgprev').textContent = '--:--'; }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'tgtext') { var ok = document.getElementById('tgok'); if (ok && !ok.disabled) ok.click(); }
});
