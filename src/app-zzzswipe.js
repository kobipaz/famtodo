/* ↩ Back: swipe left→right from the left edge of the screen on the iPhone; on the Mac the trackpad's two-finger swipe, the mouse back button,
   ⌘[ and Esc — every screen change is also a browser history step, so the browser's own back works too.
   (the iPhone home-screen app has no back button).
   Back closes, in order: an open window → the ☰ menu → the settings panel → an open task card → the previous screen.
   Loaded last so it sees every screen change (including the home screen). */
/* The browser history is the one source of truth: every screen change adds a history step that remembers
   which screen it was ({ft:1, screen, idx}), so back AND forward (Mac trackpad, mouse buttons, ⌘[ ⌘]) land
   exactly where they should. Windows / the menu / an open card are closed by "back" without leaving the screen. */
var NAV = { last: null, quiet: 0 };
function navValid(id) { return !!(id && (L[id] || id === 'all' || id === 'archive')); }
function navIdx() { return history.state && history.state.ft ? (history.state.idx || 0) : 0; }
function navReset() {   /* start of a session / back from the background: this screen is the first step */
  NAV.last = st.active;
  try { history.replaceState({ ft: 1, screen: st.active, idx: 0 }, ''); } catch (e) {}
}
var _renderListSW = renderList;
renderList = function () {
  var r = _renderListSW.apply(this, arguments);
  if (st.me && st.screen === 'main') {
    if (NAV.quiet) NAV.last = st.active;
    else if (NAV.last === null) navReset();
    else if (NAV.last !== st.active) {
      NAV.last = st.active;
      try { history.pushState({ ft: 1, screen: st.active, idx: navIdx() + 1 }, ''); } catch (e) {}
    }
  }
  return r;
};
function navQuiet(fn) { NAV.quiet++; try { fn(); } finally { NAV.quiet--; } }
var _startMainSW = startMain;
startMain = function (p) { navQuiet(function () { _startMainSW(p); }); navReset(); };
if (typeof goHome === 'function') { var _goHomeSW = goHome; goHome = function () { navQuiet(_goHomeSW); navReset(); }; }
function navShow(id) {   /* show a screen without adding a history step */
  if (!navValid(id)) id = L.home ? 'home' : st.lists[0];
  navQuiet(function () {
    st.active = id; st.open = null; st.editing = null; st.drawer = false;
    if (id !== 'home') LS.set('list_' + st.me.id, id);
    renderChips(); renderList(); window.scrollTo(0, 0);
  });
}
function swOverlay() {   /* close the top window / menu / open card; true if something was closed */
  var back = document.querySelector('.nbback');
  if (back) { back.click(); return true; }
  if (st.drawer) { st.drawer = false; renderChips(); return true; }
  if (st.panel) { st.panel = false; renderPanel(); return true; }
  if (st.timePick || st.datePick) { var c = document.querySelector('#sheet [data-time-close],#sheet [data-date-close]'); if (c) { c.click(); return true; } }
  if (st.editing) return false;
  if (st.open) { navQuiet(function () { st.open = null; renderList(); }); return true; }
  return false;
}
function swGoBack() {   /* iPhone swipe: close something, else one screen back */
  if (swOverlay()) return true;
  if (navIdx() > 0) { history.back(); return true; }
  if (st.active !== 'home' && L.home) { navShow('home'); navReset(); return true; }
  return false;
}
function swBack() { return swGoBack(); }
window.addEventListener('popstate', function (e) {
  if (!st.me || st.screen !== 'main') return;
  var s = e.state;
  if (!s || !s.ft) { navShow(L.home ? 'home' : st.active); navReset(); return; }
  if (s.screen === st.active) { swOverlay(); return; }
  swOverlay();   /* a window open on the old screen is closed on the way */
  navShow(s.screen);
});
document.addEventListener('keydown', function (e) {
  if (!st.me || st.screen !== 'main') return;
  if (e.key === 'Escape') { if (swOverlay()) e.preventDefault(); }
});
/* the gesture + a small arrow that follows the finger */
var SW = null, SW_EDGE = 30;
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
  /* only from the left edge of the screen (like the iPhone's own back) — a swipe on a task row is archive / delete */
  if (e.touches[0].clientX > SW_EDGE) return;
  if (typeof sw !== 'undefined') sw = null;   /* cancel the task-row swipe that started with the same finger */
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
function swTouchEnd() {
  var h = document.getElementById('swhint');
  if (h) { h.style.opacity = 0; h.classList.remove('go'); }
  if (SW && SW.ok && SW.dx >= 90) swGoBack();
  SW = null;
}
document.addEventListener('touchend', swTouchEnd, { passive: true });
document.addEventListener('touchcancel', function () { SW = null; var h = document.getElementById('swhint'); if (h) h.style.opacity = 0; }, { passive: true });
if (st.me && st.screen === 'main') navReset();
