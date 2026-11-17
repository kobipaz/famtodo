/* Update notice: compares this page's build version with version.json on the server */
var APP_VERSION = '@@VERSION@@';
var updDismissed = '';
function checkForUpdate() {
  if (!/^[0-9a-f]{7,}$/.test(APP_VERSION) || !window.fetch) return;   // local/demo builds have no version
  fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j && j.v && j.v !== APP_VERSION && j.v !== updDismissed) showUpdateBar(j.v); })
    .catch(function () {});
}
function showUpdateBar(v) {
  if (document.getElementById('updbar')) return;
  var d = document.createElement('div'); d.id = 'updbar';
  d.innerHTML = '<span>✨ יש גרסה חדשה של FamToDo</span><button class="upd-go">עדכון</button><button class="upd-x" aria-label="סגירה">✕</button>';
  d.querySelector('.upd-go').onclick = function () { location.replace(location.pathname + '?v=' + v); };
  d.querySelector('.upd-x').onclick = function () { updDismissed = v; d.remove(); };
  document.body.appendChild(d);
}
setTimeout(checkForUpdate, 3000);
setInterval(checkForUpdate, 5 * 60 * 1000);
document.addEventListener('visibilitychange', function () { if (!document.hidden) checkForUpdate(); });
/* show the version in the profile panel */
var _renderPanel = renderPanel;
renderPanel = function () {
  _renderPanel();
  var p = document.querySelector('#sheet .panel'); if (!p || !st.panel || st.pick || st.topicSheet) return;
  p.insertAdjacentHTML('beforeend', '<div style="text-align:center;color:var(--muted);font-size:12px;margin-top:14px;direction:ltr">FamToDo · ' + (/^[0-9a-f]{7,}$/.test(APP_VERSION) ? APP_VERSION : 'demo') + '</div>');
};
