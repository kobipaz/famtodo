/* Dark mode: follows the phone by default; can be fixed to light/dark (saved per device) */
var themeMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function themePref() { return LS.get('theme') || 'auto'; }
function applyTheme() {
  var p = themePref(), dark = p === 'dark' || (p === 'auto' && themeMQ && themeMQ.matches);
  document.documentElement.classList.toggle('dark', !!dark);
  var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#0f1624' : '#f3f7fc');
}
if (themeMQ) { if (themeMQ.addEventListener) themeMQ.addEventListener('change', applyTheme); else if (themeMQ.addListener) themeMQ.addListener(applyTheme); }
applyTheme();
var _renderPanelT = renderPanel;
renderPanel = function () {
  _renderPanelT();
  var p = document.querySelector('#sheet .panel'); if (!p || !st.panel || st.pick || st.topicSheet) return;
  var cur = themePref(), opt = function (v, label) { return '<button class="' + (cur === v ? 'on' : '') + '" data-theme-set="' + v + '">' + label + '</button>'; };
  var box = '<div class="setrow"><span>🌓 מצב תצוגה</span><div class="seg">' + opt('auto', 'אוטומטי') + opt('light', 'בהיר') + opt('dark', 'כהה') + '</div></div>';
  var acts = p.querySelector('.actions:last-of-type');
  if (acts) acts.insertAdjacentHTML('beforebegin', box); else p.insertAdjacentHTML('beforeend', box);
};
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-theme-set]'); if (!b) return;
  LS.set('theme', b.getAttribute('data-theme-set')); applyTheme(); renderPanel();
});
