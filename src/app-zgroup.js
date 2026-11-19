/* Topic view: each topic is a collapsible group. Closed by default; the header shows how many
   tasks it has and whether any are late / due today. Open groups are remembered on this device. */
function grpOpenSet() { try { return JSON.parse(LS.get('grpOpen') || '[]'); } catch (e) { return []; } }
function grpSave(a) { LS.set('grpOpen', JSON.stringify(a)); }
function grpToggle(id, on) {
  var a = grpOpenSet().filter(function (x) { return x !== id; });
  if (on) a.push(id); grpSave(a);
}
var _renderListG = renderList;
renderList = function () {
  var j = st.justAdded;
  _renderListG.apply(this, arguments);
  if (st.view !== 'topic' || st.active === 'archive' || !st.loaded) return;
  var list = document.getElementById('list'); if (!list) return;
  var secs = list.querySelectorAll('.tsec'); if (!secs.length) return;
  var open = st.tasks.filter(function (t) { return !t.archived && !t.done && (st.active === 'all' || t.list === st.active); });
  var shown = TOPICS.filter(function (tp) { return open.some(function (t) { return topicOf(t) === tp; }); });
  var openIds = grpOpenSet();
  /* a task that was just added opens its group so it can be seen */
  if (j) {
    var nt = open.filter(function (t) { return t.title === j.title && t.createdBy === st.me.id; }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); })[0];
    if (nt && openIds.indexOf(topicOf(nt).id) < 0) { openIds.push(topicOf(nt).id); grpSave(openIds); }
  }
  var allOpen = true;
  Array.prototype.forEach.call(secs, function (sec, i) {
    var tp = shown[i]; if (!tp) return;
    var g = open.filter(function (t) { return topicOf(t) === tp; });
    var late = g.filter(function (t) { return t.due && dayDiff(t.due) < 0; }).length;
    var today = g.filter(function (t) { return t.due && dayDiff(t.due) === 0; }).length;
    var isOpen = openIds.indexOf(tp.id) >= 0; if (!isOpen) allOpen = false;
    var wrap = document.createElement('div'); wrap.className = 'tgrp' + (isOpen ? ' open' : '');
    var head = document.createElement('button'); head.type = 'button'; head.className = 'tghead'; head.setAttribute('data-grp', tp.id);
    head.innerHTML = '<span class="tgi">' + tp.icon + '</span><span class="tgn">' + esc(tp.name) + '</span>' +
      (late ? '<span class="tgb late">' + late + ' באיחור</span>' : '') + (today ? '<span class="tgb today">' + today + ' היום</span>' : '') +
      '<span class="tgc">' + g.length + '</span><span class="tga">‹</span>';
    var body = document.createElement('div'); body.className = 'tgbody';
    var n = sec.nextElementSibling;
    while (n && n.classList.contains('task')) { var nx = n.nextElementSibling; body.appendChild(n); n = nx; }
    wrap.appendChild(head); wrap.appendChild(body);
    sec.parentNode.replaceChild(wrap, sec);
  });
  var first = list.querySelector('.tgrp');
  if (first && shown.length > 1) {
    var bar = document.createElement('div'); bar.className = 'tgall';
    bar.innerHTML = '<button type="button" data-grp-all="' + (allOpen ? '0' : '1') + '">' + (allOpen ? '⊖ סגירת הכל' : '⊕ פתיחת הכל') + '</button>';
    first.parentNode.insertBefore(bar, first);
  }
};
document.addEventListener('click', function (e) {
  var h = e.target.closest && e.target.closest('[data-grp]');
  if (h) {
    var w = h.parentNode, on = !w.classList.contains('open');
    w.classList.toggle('open', on); grpToggle(h.getAttribute('data-grp'), on);
    var b = document.querySelector('[data-grp-all]'); if (b) renderList();
    return;
  }
  var a = e.target.closest && e.target.closest('[data-grp-all]');
  if (a) {
    grpSave(a.getAttribute('data-grp-all') === '1' ? TOPICS.map(function (t) { return t.id; }) : []);
    renderList();
  }
});
if (st.me && st.screen === 'main') renderList();
