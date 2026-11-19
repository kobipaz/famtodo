/* "All tasks" for Kobi & Orit: a third view "👥 לפי אדם" — one collapsible group per list
   (each person, then the shared lists). Closed by default; open groups are remembered on this device. */
function pplCan() { return st.me && (st.me.id === 'kobi' || st.me.id === 'orit') && st.active === 'all'; }
function pplOpenSet() { try { return JSON.parse(LS.get('pplOpen') || '[]'); } catch (e) { return []; } }
function pplSave(a) { LS.set('pplOpen', JSON.stringify(a)); }
function pplIcon(l) {
  return l.personal ? av(l.id, 'pgav') : '<span class="tgi">' + l.icon + '</span>';
}
var _renderListP = renderList;
renderList = function () {
  var j = st.justAdded;
  var people = st.view === 'people';
  if (people && !pplCan()) { st.view = 'date'; _renderListP.apply(this, arguments); st.view = 'people'; addPeopleSeg(); return; }
  if (!people) { _renderListP.apply(this, arguments); addPeopleSeg(); return; }
  st.view = 'date'; try { _renderListP.apply(this, arguments); } finally { st.view = 'people'; }
  addPeopleSeg();
  var list = document.getElementById('list'); if (!list || !st.loaded) return;
  var tasks = Array.prototype.slice.call(list.querySelectorAll(':scope > .task')).filter(function (el) {
    var t = find(el.getAttribute('data-tid')); return t && !t.done;
  });
  if (!tasks.length) return;
  var openIds = pplOpenSet();
  if (j) {
    var nt = st.tasks.filter(function (t) { return t.title === j.title && t.createdBy === st.me.id && !t.done; }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); })[0];
    if (nt && openIds.indexOf(nt.list) < 0) { openIds.push(nt.list); pplSave(openIds); }
  }
  var order = [st.me.id].concat(st.lists.filter(function (id) { return L[id].personal && id !== st.me.id; }),
                                  st.lists.filter(function (id) { return !L[id].personal; }));
  var frag = document.createDocumentFragment(), groups = 0, allOpen = true;
  order.forEach(function (lid) {
    var els = tasks.filter(function (el) { return find(el.getAttribute('data-tid')).list === lid; });
    if (!els.length) return;
    groups++;
    var g = els.map(function (el) { return find(el.getAttribute('data-tid')); });
    var late = g.filter(function (t) { return t.due && dayDiff(t.due) < 0; }).length;
    var today = g.filter(function (t) { return t.due && dayDiff(t.due) === 0; }).length;
    var isOpen = openIds.indexOf(lid) >= 0; if (!isOpen) allOpen = false;
    var l = L[lid];
    var wrap = document.createElement('div'); wrap.className = 'tgrp' + (isOpen ? ' open' : '');
    wrap.style.borderInlineStart = '5px solid ' + l.color;
    var head = document.createElement('button'); head.type = 'button'; head.className = 'tghead'; head.setAttribute('data-pgrp', lid);
    head.innerHTML = pplIcon(l) + '<span class="tgn">' + esc(lid === st.me.id ? l.name + ' (שלי)' : l.name) + '</span>' +
      (late ? '<span class="tgb late">' + late + ' באיחור</span>' : '') + (today ? '<span class="tgb today">' + today + ' היום</span>' : '') +
      '<span class="tgc">' + g.length + '</span><span class="tga">‹</span>';
    var body = document.createElement('div'); body.className = 'tgbody';
    els.forEach(function (el) { body.appendChild(el); });
    wrap.appendChild(head); wrap.appendChild(body); frag.appendChild(wrap);
  });
  if (groups > 1) {
    var bar = document.createElement('div'); bar.className = 'tgall';
    bar.innerHTML = '<button type="button" data-pgrp-all="' + (allOpen ? '0' : '1') + '">' + (allOpen ? '⊖ סגירת הכל' : '⊕ פתיחת הכל') + '</button>';
    frag.insertBefore(bar, frag.firstChild);
  }
  var ref = list.querySelector('.donehdr') || list.querySelector('.demo');
  list.insertBefore(frag, ref || null);
};
function addPeopleSeg() {
  var seg = document.querySelector('#list .seg');
  if (!seg || !pplCan() || seg.querySelector('[data-id="people"]')) return;
  seg.insertAdjacentHTML('beforeend', '<button class="' + (st.view === 'people' ? 'on' : '') + '" data-act="view" data-id="people">👥 לפי אדם</button>');
  if (st.view === 'people') seg.querySelectorAll('[data-id="date"]').forEach(function (b) { b.classList.remove('on'); });
}
document.addEventListener('click', function (e) {
  var h = e.target.closest && e.target.closest('[data-pgrp]');
  if (h) {
    var w = h.parentNode, on = !w.classList.contains('open'), id = h.getAttribute('data-pgrp');
    var a = pplOpenSet().filter(function (x) { return x !== id; }); if (on) a.push(id); pplSave(a);
    w.classList.toggle('open', on);
    if (document.querySelector('[data-pgrp-all]')) renderList();
    return;
  }
  var b = e.target.closest && e.target.closest('[data-pgrp-all]');
  if (b) { pplSave(b.getAttribute('data-pgrp-all') === '1' ? st.lists.slice() : []); renderList(); }
});
if (LS.get('view') === 'people') st.view = 'people';
if (st.me && st.screen === 'main') renderList();
