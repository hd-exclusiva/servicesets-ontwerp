/*
 * Kleine runtime om de ontwerpbestanden (*.dc.html) los te laten draaien,
 * bijvoorbeeld op GitHub Pages. Ondersteunt:
 *   <x-dc> met <helmet>, {{ binding }} in tekst en attributen,
 *   <sc-for list as>, <sc-if value>, onClick/onChange en class Component extends DCLogic.
 * Ontbrekende afbeeldingen in img/ worden netjes vervangen door een grijs vlak.
 */
(function () {
  var hide = document.createElement('style');
  hide.textContent = 'x-dc{display:none!important}';
  document.head.appendChild(hide);

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.renderVals = function () { return {}; };
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = Object.assign({}, this.state, next);
    if (this.__render) this.__render();
  };
  window.DCLogic = DCLogic;

  var EXT = ['.jpg', '.png', '.webp', '.jpeg', '.svg'];
  var goodSrc = {};

  function lookup(expr, scopes) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);
    var parts = expr.split('.');
    for (var i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i] && Object.prototype.hasOwnProperty.call(scopes[i], parts[0])) {
        var v = scopes[i][parts[0]];
        for (var j = 1; j < parts.length && v != null; j++) v = v[parts[j]];
        return v;
      }
    }
    return undefined;
  }

  var WHOLE = /^\s*\{\{([^}]+)\}\}\s*$/;
  var ANY = /\{\{([^}]+)\}\}/g;

  function interp(str, scopes) {
    return str.replace(ANY, function (_, e) {
      var v = lookup(e, scopes);
      return v == null ? '' : String(v);
    });
  }

  function processAttrs(el, src, scopes) {
    var attrs = Array.prototype.slice.call(src.attributes);
    attrs.forEach(function (a) {
      var name = a.name, val = a.value;
      if (name.indexOf('hint-') === 0) return;
      if (name.indexOf('on') === 0 && WHOLE.test(val)) {
        var fn = lookup(val.match(WHOLE)[1], scopes);
        if (typeof fn === 'function') el.addEventListener(name.slice(2), function (ev) { fn(ev); });
        return;
      }
      if (val.indexOf('{{') === -1) { el.setAttribute(name, val); return; }
      var m = val.match(WHOLE);
      var out = m ? lookup(m[1], scopes) : interp(val, scopes);
      if (out === false && name !== 'aria-pressed') return;
      out = out == null ? '' : String(out);
      el.setAttribute(name, out);
      if (name === 'value' && 'value' in el) el.value = out;
    });
  }

  function walk(node, scopes, out) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(node.nodeValue.indexOf('{{') > -1 ? interp(node.nodeValue, scopes) : node.nodeValue));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    var kids = function (n) { return n.tagName.toLowerCase() === 'template' ? n.content.childNodes : n.childNodes; };
    if (tag === 'sc-for' || (tag === 'template' && node.hasAttribute('data-sc-for'))) {
      var list = lookup((node.getAttribute('list') || '').replace(/[{}]/g, ''), scopes) || [];
      var as = node.getAttribute('as') || 'item';
      list.forEach(function (item, idx) {
        var s = {}; s[as] = item; s.index = idx;
        var next = scopes.concat([s]);
        kids(node).forEach(function (c) { walk(c, next, out); });
      });
      return;
    }
    if (tag === 'sc-if' || (tag === 'template' && node.hasAttribute('data-sc-if'))) {
      var v = lookup((node.getAttribute('value') || node.getAttribute('data-sc-if') || '').replace(/[{}]/g, ''), scopes);
      if (v) kids(node).forEach(function (c) { walk(c, scopes, out); });
      return;
    }
    var el = document.createElementNS(node.namespaceURI, node.localName);
    processAttrs(el, node, scopes);
    var target = el.tagName.toLowerCase() === 'template' ? el.content : el;
    node.childNodes.forEach(function (c) { walk(c, scopes, target); });
    out.appendChild(el);
  }

  function placeholder(img) {
    var src = img.getAttribute('data-base') || '';
    var ph;
    if (/logo$/.test(src)) {
      ph = document.createElement('span');
      ph.innerHTML = '<span style="font-weight:300">SERVICE</span><span style="font-weight:900">SETS</span>';
      ph.style.cssText = 'font-size:20px;line-height:1;color:inherit';
    } else {
      ph = document.createElement('span');
      ph.setAttribute('style', img.getAttribute('style') || '');
      ph.style.display = 'flex';
      ph.style.alignItems = 'center';
      ph.style.justifyContent = 'center';
      ph.style.background = '#F2F4F4';
      ph.style.color = '#5B5F61';
      ph.style.fontSize = '12px';
      ph.style.textAlign = 'center';
      ph.style.padding = '6px';
      ph.style.boxSizing = 'border-box';
      if (!ph.style.width) ph.style.width = '100%';
      var w = parseFloat(ph.style.width);
      ph.textContent = (w && w < 90) ? '' : (img.getAttribute('alt') || 'foto volgt');
    }
    img.replaceWith(ph);
  }

  function fixImages(root) {
    root.querySelectorAll('img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (!src) { placeholder(img); return; }
      var m = src.match(/^(img\/[^.]+)(\.[a-z]+)?$/i);
      if (!m) return;
      var base = m[1];
      img.setAttribute('data-base', base);
      if (goodSrc[base] === null) { placeholder(img); return; }
      if (goodSrc[base]) { img.src = goodSrc[base]; return; }
      var first = m[2] || EXT[0];
      var tries = [base + first].concat(EXT.filter(function (e) { return e !== first; }).map(function (e) { return base + e; }));
      var k = 0;
      img.addEventListener('load', function () { goodSrc[base] = img.getAttribute('src'); });
      img.addEventListener('error', function onErr() {
        k++;
        if (k < tries.length) img.src = tries[k];
        else { goodSrc[base] = null; img.removeEventListener('error', onErr); placeholder(img); }
      });
      img.src = tries[0];
    });
  }

  function boot() {
    var host = document.querySelector('x-dc');
    if (!host) return;
    var helmet = host.querySelector('helmet');
    if (helmet) {
      Array.prototype.slice.call(helmet.childNodes).forEach(function (n) { document.head.appendChild(n); });
      helmet.remove();
    }
    var tpl = document.createElement('template');
    tpl.innerHTML = host.innerHTML;
    host.remove();

    var props = {};
    var script = document.querySelector('script[type="text/x-dc"]');
    var Comp = DCLogic;
    if (script) {
      try {
        var meta = JSON.parse(script.getAttribute('data-props') || '{}');
        Object.keys(meta).forEach(function (k) {
          if (k.charAt(0) !== '$' && meta[k] && 'default' in meta[k]) props[k] = meta[k]['default'];
        });
      } catch (e) { /* geen props */ }
      Comp = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic);
    }
    var inst = new Comp(props);
    var root = document.createElement('div');
    root.id = 'dc-root';
    document.body.appendChild(root);

    var pending = false;
    inst.__render = function () {
      if (pending) return;
      pending = true;
      Promise.resolve().then(function () {
        pending = false;
        draw();
      });
    };
    function draw() {
      var vals = inst.renderVals() || {};
      var frag = document.createDocumentFragment();
      tpl.content.childNodes.forEach(function (c) { walk(c, [vals], frag); });
      fixImages(frag);
      root.replaceChildren(frag);
    }
    draw();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
