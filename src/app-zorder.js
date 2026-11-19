/* Open task card, in a clear order:
   1. task tools (✏️ edit title, ↪️ move, 📦 archive, 🗑 delete) — right under the title
   2. the edit box, when editing
   3. "💬 הערות" — the notes and the box to add one */
var _taskHtmlO = taskHtml;
taskHtml = function (t) {
  var h = _taskHtmlO(t);
  if (h.indexOf('<div class="details">') < 0) return h;
  var tpl = document.createElement('template'); tpl.innerHTML = h;
  var d = tpl.content.querySelector('.details'); if (!d) return h;
  var acts = null, kids = d.children;
  for (var i = kids.length - 1; i >= 0; i--) if (kids[i].classList.contains('actions')) { acts = kids[i]; break; }
  var edit = d.querySelector(':scope > .editbox');
  var notes = Array.prototype.filter.call(kids, function (el) { return el.classList.contains('note') || el.classList.contains('row'); });
  var n = d.querySelectorAll(':scope > .note').length;
  var sec = document.createElement('div'); sec.className = 'notesec';
  sec.innerHTML = '<div class="noteshd">💬 הערות' + (n ? ' <span>' + n + '</span>' : '') + '</div>';
  notes.forEach(function (el) { sec.appendChild(el); });
  d.innerHTML = '';
  if (acts && !edit) { acts.classList.add('tacts'); d.appendChild(acts); }   /* while editing, only the edit box */
  if (edit) d.appendChild(edit);
  d.appendChild(sec);
  return tpl.innerHTML;
};
if (st.me && st.screen === 'main') renderList();
