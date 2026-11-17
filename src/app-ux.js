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
  setTimeout(function () {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1700);
  }, 30);
}
var _renderListU = renderList;
renderList = function () { _renderListU(); revealJustAdded(); };
var _applyTimeU = applyTime;
applyTime = function (target, val) {
  _applyTimeU(target, val);
  var i = document.getElementById('newtask');
  if (target === 'new' && val && i && clean(i.value, 200)) addTask();
};
