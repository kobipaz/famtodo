/* UX: (1) after adding a task, scroll to it and flash it; (2) choosing a time for a typed task saves it (like +) */
var _addTaskU = addTask;
addTask = function () {
  var i = document.getElementById('newtask'), v = i ? clean(i.value, 200) : '';
  if (v) st.justAdded = { title: v, at: Date.now() - 1500 };
  _addTaskU();
};
function revealJustAdded() {
  var j = st.justAdded; if (!j) return;
  if (Date.now() - j.at > 8000) { st.justAdded = null; return; }
  var t = st.tasks.filter(function (x) { return x.title === j.title && (x.createdAt || 0) >= j.at && x.createdBy === (st.me && st.me.id); })
                  .sort(function (a, b) { return b.createdAt - a.createdAt; })[0];
  if (!t) return;
  var el = document.querySelector('.task[data-tid="' + t.id + '"]'); if (!el) return;
  st.justAdded = null;
  var inp = document.getElementById('newtask'); if (inp && document.activeElement === inp) inp.blur();   // close the phone keyboard
  var go = function () {
    var e2 = document.querySelector('.task[data-tid="' + t.id + '"]'); if (!e2) return;
    var r = e2.getBoundingClientRect(), y = r.top + (window.pageYOffset || document.documentElement.scrollTop) - Math.max(80, (window.innerHeight - r.height) / 3);
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    e2.classList.remove('flash'); void e2.offsetWidth; e2.classList.add('flash');
    setTimeout(function () { e2.classList.remove('flash'); }, 1700);
  };
  setTimeout(go, 60); setTimeout(go, 450);          // second pass after the keyboard has closed
}
var _renderListU = renderList;
renderList = function () { _renderListU(); revealJustAdded(); };
var _applyTimeU = applyTime;
applyTime = function (target, val) {
  _applyTimeU(target, val);
  var i = document.getElementById('newtask');
  if (target === 'new' && val && i && clean(i.value, 200)) addTask();
};

/* (3) ✕ inside the input bar: discard the typed task and any picked date/time/topic without saving */
function newDirty() { var i = document.getElementById('newtask'); return !!((i && i.value.trim()) || st.newDue || st.newTime || st.newTopic); }
function updClear() { var b = document.getElementById('xclear'); if (b) b.style.display = newDirty() ? '' : 'none'; }
function installClear() {
  var i = document.getElementById('newtask'); if (!i || document.getElementById('xclear')) return;
  i.insertAdjacentHTML('afterend', '<button type="button" id="xclear" class="xclear" aria-label="ביטול">✕</button>');
  i.addEventListener('input', updClear);
  i.addEventListener('keydown', function (e) { if (e.key === 'Escape') discardNew(); });
  document.getElementById('xclear').addEventListener('click', function (e) { e.preventDefault(); discardNew(); });
  updClear();
}
function discardNew() {
  var i = document.getElementById('newtask'); if (i) { i.value = ''; i.blur(); }
  st.newDue = ''; st.newTime = ''; st.newTopic = '';
  renderOpts(); updClear();
}
var _renderShellU = renderShell;
renderShell = function () { _renderShellU(); installClear(); };
var _renderOptsU = renderOpts;
renderOpts = function () { _renderOptsU(); updClear(); };
var _addTaskU2 = addTask;
addTask = function () { _addTaskU2(); updClear(); };
installClear();
