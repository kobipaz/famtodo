/* Edit mode: the task title is edited in a full-width box that grows with the text,
   so long titles are fully visible (Enter still saves). */
var _taskHtmlE = taskHtml;
taskHtml = function (t) {
  return _taskHtmlE(t).replace(/<input class="inp" (data-keep="edit-[^"]*" id="edit-[^"]*") value="([^"]*)" maxlength="200" (data-enter="save" data-id="[^"]*")>/,
    function (m, a, val, b) { return '<textarea class="inp editta" ' + a + ' rows="2" maxlength="200" enterkeyhint="done" ' + b + '>' + val + '</textarea>'; });
};
function growEdit(el) { el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px'; }
var _renderListE = renderList;
renderList = function () {
  var r = _renderListE.apply(this, arguments);
  document.querySelectorAll('.editta').forEach(growEdit);
  return r;
};
document.addEventListener('input', function (e) {
  if (e.target.classList && e.target.classList.contains('editta')) {
    if (/\n/.test(e.target.value)) e.target.value = e.target.value.replace(/\n+/g, ' ');
    growEdit(e.target);
  }
});
