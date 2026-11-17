/* Fixed emoji: every emoji is shown as a bundled image (Twemoji 15.0.0, pinned at build time),
   so it looks the same on every phone and never changes with OS updates. */
var EMOJI_BASE = '@@EMOJI@@';
(function () {
  if (EMOJI_BASE.indexOf('@@') === 0) return;               // local/demo builds: keep system emoji
  var RE;
  try { RE = new RegExp('(?:\\p{RI}\\p{RI}|\\p{Extended_Pictographic}(?:\\uFE0F|\\p{EMod})?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{EMod})?)*)', 'gu'); }
  catch (e) { return; }
  function code(s) {
    var zwj = s.indexOf('‍') >= 0, out = [];
    for (var ch of s) { var c = ch.codePointAt(0); if (c === 0xfe0f && !zwj) continue; out.push(c.toString(16)); }
    return out.join('-');
  }
  function fix(node) {
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|INPUT|TITLE|svg|text)$/i.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
        RE.lastIndex = 0; return RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(function (n) {
      var txt = n.nodeValue, frag = document.createDocumentFragment(), last = 0, m; RE.lastIndex = 0;
      while ((m = RE.exec(txt))) {
        if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
        var img = document.createElement('img');
        img.className = 'emj'; img.alt = m[0]; img.draggable = false; img.src = EMOJI_BASE + code(m[0]) + '.svg';
        img.onerror = function () { this.replaceWith(document.createTextNode(this.alt)); };
        frag.appendChild(img); last = m.index + m[0].length;
      }
      if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
  }
  fix(document.body);
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      m.addedNodes.forEach(function (n) { if (n.nodeType === 1) fix(n); else if (n.nodeType === 3 && n.parentNode) fix(n.parentNode); });
      if (m.type === 'characterData' && m.target.parentNode) fix(m.target.parentNode);
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
})();
