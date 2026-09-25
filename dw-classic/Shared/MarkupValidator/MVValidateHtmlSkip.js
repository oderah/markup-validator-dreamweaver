/**
 * Skip opaque HTML regions (comments, script, style, doctype).
 */
var MVValidateHtmlSkip = {};

function mvHtmlSkipComment(src, i, issues) {
  var C = MVValidateHtmlCommon;
  if (src.substr(i, 4) !== '<!--') return i;
  var cend = src.indexOf('-->', i + 4);
  if (cend < 0) {
    var pc = C.posAt(src, i);
    issues.push(C.issue('error', pc.line, pc.column, 'Unterminated HTML comment.', 4, 'comment'));
    return -1;
  }
  return cend + 3;
}

function mvHtmlSkipScript(src, i, issues) {
  var C = MVValidateHtmlCommon;
  if (src.substr(i, 7).toLowerCase() !== '<script') return i;
  var sgt = src.indexOf('>', i);
  var send = src.toLowerCase().indexOf('</script>', sgt > 0 ? sgt : i);
  if (send < 0) {
    var ps = C.posAt(src, i);
    issues.push(C.issue('error', ps.line, ps.column, 'Unclosed <script> element.', 7, 'script'));
    return -1;
  }
  return send + 9;
}

function mvHtmlSkipStyle(src, i, issues) {
  var C = MVValidateHtmlCommon;
  if (src.substr(i, 6).toLowerCase() !== '<style') return i;
  var stgt = src.indexOf('>', i);
  var stend = src.toLowerCase().indexOf('</style>', stgt > 0 ? stgt : i);
  if (stend < 0) {
    var pst = C.posAt(src, i);
    issues.push(C.issue('error', pst.line, pst.column, 'Unclosed <style> element.', 6, 'style'));
    return -1;
  }
  return stend + 8;
}

function mvHtmlSkipDoctype(src, i, issues) {
  var C = MVValidateHtmlCommon;
  if (src.substr(i, 9).toLowerCase() !== '<!doctype') return i;
  var dgt = src.indexOf('>', i);
  if (dgt < 0) {
    var pd = C.posAt(src, i);
    issues.push(C.issue('error', pd.line, pd.column, 'Unterminated DOCTYPE.', 9, 'doctype'));
    return -1;
  }
  return dgt + 1;
}

function mvHtmlSkipSpecialMarkup(src, i, issues) {
  var next = mvHtmlSkipComment(src, i, issues);
  if (next < 0) return next;
  if (next > i) return next;
  next = mvHtmlSkipScript(src, i, issues);
  if (next < 0) return next;
  if (next > i) return next;
  next = mvHtmlSkipStyle(src, i, issues);
  if (next < 0) return next;
  if (next > i) return next;
  return mvHtmlSkipDoctype(src, i, issues);
}

MVValidateHtmlSkip.skipSpecialMarkup = mvHtmlSkipSpecialMarkup;
