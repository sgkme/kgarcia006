// The same game runs from its project folder or the self-contained offline file.
window.SS = window.SS || {};
SS.assetURL = function (path) {
  // Legacy callers keep their semantic icon names; the artwork is now SVG.
  path = path.replace(/^(assets\/icons\/[^.]+)\.png$/, '$1.svg');
  const embedded = (window.SS_EMBEDDED_ASSETS || {})[path];
  if (embedded) return embedded;
  return new URL(path, document.baseURI).href;
};
SS.assetText = function (path) {
  const inline = window.SS_EMBEDDED_TEXT || {};
  return path in inline ? Promise.resolve(inline[path]) : fetch(path).then(r => { if (!r.ok) throw Error(path + ': ' + r.status); return r.text(); });
};
SS.assetHTML = function (html) {
  return String(html).replace(/\bsrc=(['"])(assets\/[^'"]+)\1/g, (_all, quote, path) => 'src=' + quote + SS.assetURL(path) + quote);
};
