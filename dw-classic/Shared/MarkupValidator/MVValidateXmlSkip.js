/**
 * Skip opaque XML regions (comments, CDATA, PI, doctype).
 */
var MVValidateXmlSkip = {};

function mvXmlSkipComment(src, i, issues) {
  var C = MVValidateXmlCommon;
  if (src.substr(i, 4) !== '<!--') return i;
  var cend = src.indexOf('-->', i + 4);
  if (cend < 0) {
    var p = C.posAt(src, i);
    issues.push(C.issue('error', p.line, p.column, 'Unterminated XML comment.', 4));
    return -1;
  }
  return cend + 3;
}

function mvXmlSkipCdata(src, i, issues) {
  var C = MVValidateXmlCommon;
  if (src.substr(i, 9) !== '<![CDATA[') return i;
  var cdend = src.indexOf(']]>', i + 9);
  if (cdend < 0) {
    var p2 = C.posAt(src, i);
    issues.push(C.issue('error', p2.line, p2.column, 'Unterminated CDATA section.', 9));
    return -1;
  }
  return cdend + 3;
}

function mvXmlSkipPi(src, i, issues) {
  var C = MVValidateXmlCommon;
  if (src.charAt(i + 1) !== '?') return i;
  var pend = src.indexOf('?>', i + 2);
  if (pend < 0) {
    var p3 = C.posAt(src, i);
    issues.push(C.issue('error', p3.line, p3.column, 'Unterminated processing instruction.', 2));
    return -1;
  }
  return pend + 2;
}

function mvXmlDoctypeBracketDepth(ch, depth) {
  if (ch === '[') return depth + 1;
  if (ch === ']') return depth - 1;
  return depth;
}

function mvXmlDoctypeEnd(src, start, len) {
  var depth = 0;
  var j = start;
  while (j < len) {
    var ch = src.charAt(j);
    depth = mvXmlDoctypeBracketDepth(ch, depth);
    if (ch === '>' && depth === 0) return j;
    j++;
  }
  return -1;
}

function mvXmlSkipDoctype(src, i, len, issues) {
  var C = MVValidateXmlCommon;
  if (src.substr(i, 9).toLowerCase() !== '<!doctype') return i;
  var end = mvXmlDoctypeEnd(src, i + 9, len);
  if (end < 0) {
    var p4 = C.posAt(src, i);
    issues.push(C.issue('error', p4.line, p4.column, 'Unterminated DOCTYPE.', 9));
    return -1;
  }
  return end + 1;
}

function mvXmlSkipSpecial(src, i, len, issues) {
  var next = mvXmlSkipComment(src, i, issues);
  if (next < 0) return next;
  if (next > i) return next;
  next = mvXmlSkipCdata(src, i, issues);
  if (next < 0) return next;
  if (next > i) return next;
  next = mvXmlSkipPi(src, i, issues);
  if (next < 0) return next;
  if (next > i) return next;
  return mvXmlSkipDoctype(src, i, len, issues);
}

MVValidateXmlSkip.skipSpecial = mvXmlSkipSpecial;
