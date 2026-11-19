/* 📓 Details notebook per task: a small button at the top-left of each task opens a floating
   window to write longer details (saved in the task as "details"). Save / Cancel / Close. */
var NB_MAX = 5000;
var NB_SHARE_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
/* Share: title in *bold* (WhatsApp/Telegram format) + the details as plain text — what's in the window now */
function nbShare() {
  if (!st.nb) return;
  var t = find(st.nb.id); if (!t) return;
  var ta = document.getElementById('nbtext'), det = String(ta ? ta.value : (t.details || '')).replace(/\s+$/, '');
  var text = '*' + t.title.trim() + '*' + (det ? '\n' + det : '');
  if (navigator.share) {
    navigator.share({ text: text }).catch(function (e) { if (e && e.name !== 'AbortError') nbCopy(text); });
  } else nbCopy(text);
}
function nbCopy(text) {
  var done = function () { toast('📋 הועתק — אפשר להדביק בכל מקום'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { nbCopyOld(text); done(); });
  else { nbCopyOld(text); done(); }
}
function nbCopyOld(text) {
  var a = document.createElement('textarea'); a.value = text; a.style.position = 'fixed'; a.style.opacity = '0';
  document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove();
}
st.nb = null;   /* { id, orig } while the window is open */
var _taskHtmlN = taskHtml;
taskHtml = function (t) {
  var h = _taskHtmlN(t);
  if (t.deleted) return h;
  var has = !!(t.details && t.details.trim());
  var btn = '<button type="button" class="nbbtn' + (has ? ' has' : '') + '" data-nb="' + t.id + '" aria-label="פרטים">📓</button>';
  return h.replace('<div class="tbody"', btn + '<div class="tbody"');
};
function nbEl() { return document.getElementById('nbwin'); }
function nbOpen(id) {
  var t = find(id); if (!t) return;
  st.nb = { id: id, orig: t.details || '' };
  var by = t.detailsBy && P[t.detailsBy] ? 'עודכן ע״י ' + esc(P[t.detailsBy].name) + ' · ' + when(t.detailsAt) : '';
  var w = nbEl(); if (!w) { w = document.createElement('div'); w.id = 'nbwin'; document.body.appendChild(w); }
  w.innerHTML = '<div class="nbback" data-nb-x="1"></div><div class="nbcard" role="dialog" aria-label="פרטים">' +
    '<div class="nbhead"><span class="nbic">📓</span><span class="nbtitle">' + esc(t.title) + '</span>' +
    '<button type="button" class="nbshare" data-nb-share="1" aria-label="שיתוף">' + NB_SHARE_SVG + '</button>' +
    '<button type="button" class="nbclose" data-nb-x="1" aria-label="סגירה">✕</button></div>' +
    '<textarea id="nbtext" maxlength="' + NB_MAX + '" placeholder="פרטים, כתובות, טלפונים, מה צריך להביא…">' + esc(t.details || '') + '</textarea>' +
    '<div class="nbmeta">' + by + '</div>' +
    '<div class="nbask hidden" id="nbask">יש שינויים שלא נשמרו. <button type="button" data-nb-save="1">לשמור</button><button type="button" data-nb-cancel="1">לא לשמור</button></div>' +
    '<div class="nbact"><button type="button" class="btn" data-nb-save="1">שמירה</button><button type="button" class="btn soft" data-nb-cancel="1">ביטול</button></div></div>';
  w.classList.add('on'); document.documentElement.classList.add('nbopen');
  var ta = document.getElementById('nbtext');
  setTimeout(function () { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 60);
}
function nbHide() { st.nb = null; var w = nbEl(); if (w) { w.classList.remove('on'); w.innerHTML = ''; } document.documentElement.classList.remove('nbopen'); }
function nbSave() {
  if (!st.nb) return;
  var id = st.nb.id, v = String(document.getElementById('nbtext').value || '').replace(/\s+$/, '').slice(0, NB_MAX);
  if (v === st.nb.orig) return nbHide();
  var patch = { details: v, detailsBy: st.me.id, detailsAt: Date.now() };
  var t = find(id); if (t) Object.assign(t, patch);
  nbHide(); renderList();
  store.update(id, patch).then(function () { toast(v ? '📓 הפרטים נשמרו' : '📓 הפרטים נמחקו'); }).catch(fail);
}
function nbClose() {
  if (!st.nb) return;
  var ta = document.getElementById('nbtext');
  if (ta && ta.value.replace(/\s+$/, '') !== st.nb.orig) { document.getElementById('nbask').classList.remove('hidden'); return; }
  nbHide();
}
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('[data-nb]');
  if (b) { e.preventDefault(); e.stopPropagation(); return nbOpen(b.getAttribute('data-nb')); }
  if (!st.nb) return;
  if (e.target.closest('[data-nb-share]')) { e.stopPropagation(); return nbShare(); }
  if (e.target.closest('[data-nb-save]')) { e.stopPropagation(); return nbSave(); }
  if (e.target.closest('[data-nb-cancel]')) { e.stopPropagation(); return nbHide(); }
  if (e.target.closest('[data-nb-x]')) { e.stopPropagation(); return nbClose(); }
}, true);
document.addEventListener('keydown', function (e) {
  if (!st.nb) return;
  if (e.key === 'Escape') { e.preventDefault(); nbClose(); }
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); nbSave(); }
}, true);
/* keep details when a task is moved to another list */
function patchStoreNotes() {
  if (!store || store._nbPatched) return;
  store._nbPatched = true;
  var _addN = store.add;
  store.add = function (t) {
    if (st.movePickSrc && find(st.movePickSrc)) { var s = find(st.movePickSrc); t.details = s.details || ''; t.detailsBy = s.detailsBy || ''; t.detailsAt = s.detailsAt || 0; }
    return _addN.apply(this, arguments);
  };
}
var _startMainN = startMain;
startMain = function (p) { patchStoreNotes(); _startMainN(p); };
patchStoreNotes();   /* the store may already exist (e.g. demo mode) */
if (typeof moveTask === 'function') {
  var _moveN = moveTask;
  moveTask = function (id) { st.movePickSrc = id; try { return _moveN.apply(this, arguments); } finally { st.movePickSrc = null; } };
}
if (st.me && st.screen === 'main') renderList();
