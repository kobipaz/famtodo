/* ↩ Back: swipe left→right on the iPhone; on the Mac the trackpad's two-finger swipe, the mouse back button,
   ⌘[ and Esc — every screen change is also a browser history step, so the browser's own back works too.
   (the iPhone home-screen app has no back button).
   Back closes, in order: an open window → the ☰ menu → the settings panel → an open task card → the previous screen.
   Loaded last so it sees every screen change (including the home screen). */
var NAV = { stack: [], last: null, going: false };
var _renderListSW = renderList;
renderList = function () {
  var r = _renderListSW.apply(this, arguments);
  if (st.me && st.screen === 'main') {
    if (NAV.last && NAV.last !== st.active && !NAV.going) {
      NAV.stack.push(NAV.last);
      if (NAV.stack.length > 30) NAV.stack.shift();
      try { history.pushState({ ftnav: 1 }, ''); } catch (e) {}
    }
    NAV.last = st.active; NAV.going = false;
  }
  return r;
};
var _startMainSW = startMain;
startMain = function (p) { NAV.stack = []; NAV.last = null; _startMainSW(p); };
function swOverlay() {   /* close the top window / menu / open card; true if something was closed */
  var back = document.querySelector('.nbback');
  if (back) { back.click(); return true; }
  if (st.drawer) { st.drawer = false; renderChips(); return true; }
  if (st.panel) { st.panel = false; renderPanel(); return true; }
  if (st.timePick || st.datePick) { var c = document.querySelector('#sheet [data-time-close],#sheet [data-date-close]'); if (c) { c.click(); return true; } }
  if (st.editing) return false;
  if (st.open) { st.open = null; renderList(); return true; }
  return false;
}
function swGoBack() {   /* gesture / key: close something, or go one screen back through the browser history */
  if (swOverlay()) return true;
  if (NAV.stack.length && history.state && history.state.ftnav) { history.back(); return true; }
  return swBack();
}
window.addEventListener('popstate', function () {
  if (!st.me || st.screen !== 'main') return;
  if (swOverlay()) { try { history.pushState({ ftnav: 1 }, ''); } catch (e) {} return; }   /* closing a window doesn't use up a screen step */
  swBack();
});
document.addEventListener('keydown', function (e) {
  if (!st.me || st.screen !== 'main') return;
  if (e.key === 'Escape') { if (swOverlay()) e.preventDefault(); }
});
function swBack() {
  if (swOverlay()) return true;
  while (NAV.stack.length) {
    var prev = NAV.stack.pop();
    if (prev === st.active || !(L[prev] || prev === 'all' || prev === 'archive')) continue;
    NAV.going = true; st.active = prev; st.open = null;
    if (prev !== 'home') LS.set('list_' + st.me.id, prev);
    renderChips(); renderList(); window.scrollTo(0, 0);
    return true;
  }
  if (st.active !== 'home' && L.home) { NAV.going = true; st.active = 'home'; st.open = null; renderChips(); renderList(); window.scrollTo(0, 0); return true; }
  return false;
}
/* the gesture + a small arrow that follows the finger */
var SW = null;
function swHint() {
  var h = document.getElementById('swhint');
  if (!h) { h = document.createElement('div'); h.id = 'swhint'; h.textContent = '→'; document.body.appendChild(h); }
  return h;
}
function swScrollsX(el) {
  for (; el && el !== document.body; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 2) { var o = getComputedStyle(el).overflowX; if (o === 'auto' || o === 'scroll') return true; }
  }
  return false;
}
document.addEventListener('touchstart', function (e) {
  SW = null;
  if (!st.me || st.screen !== 'main' || e.touches.length !== 1) return;
  var t = e.target;
  if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (swScrollsX(t)) return;
  SW = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, ok: null };
}, { passive: true });
document.addEventListener('touchmove', function (e) {
  if (!SW) return;
  var dx = e.touches[0].clientX - SW.x, dy = e.touches[0].clientY - SW.y;
  if (SW.ok === null && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) SW.ok = dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.5;
  if (!SW.ok) return;
  SW.dx = dx;
  var h = swHint(), p = Math.min(1, dx / 90);
  h.style.opacity = p; h.style.transform = 'translate(' + Math.min(dx * 0.6, 70) + 'px,-50%) scale(' + (0.7 + 0.3 * p) + ')';
  h.classList.toggle('go', dx >= 90);
}, { passive: true });
function swEnd() {
  var h = document.getElementById('swhint');
  if (h) { h.style.opacity = 0; h.classList.remove('go'); }
  if (SW && SW.ok && SW.dx >= 90) swGoBack();
  SW = null;
}
document.addEventListener('touchend', swEnd, { passive: true });
document.addEventListener('touchcancel', function () { SW = null; var h = document.getElementById('swhint'); if (h) h.style.opacity = 0; }, { passive: true });
if (st.me && st.screen === 'main') NAV.last = st.active;
