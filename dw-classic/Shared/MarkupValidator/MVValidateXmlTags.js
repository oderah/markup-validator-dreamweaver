/**
 * XML open/close tag handling.
 */
var MVValidateXmlTags = {};

function mvXmlAttrsHaveUnclosedQuote(attrs) {
  var inQ = null;
  var qi;
  for (qi = 0; qi < attrs.length; qi++) {
    var ch = attrs.charAt(qi);
    if (inQ) {
      if (ch === inQ) inQ = null;
    } else if (ch === '"' || ch === "'") {
      inQ = ch;
    }
  }
  return !!inQ;
}

function mvXmlHandleCloseTag(src, tagStart, raw, stack, issues) {
  var C = MVValidateXmlCommon;
  var cname = raw.substring(1).replace(/^\s+|\s+$/g, '').split(/\s/)[0];
  if (!cname) {
    var pc = C.posAt(src, tagStart);
    issues.push(C.issue('error', pc.line, pc.column, 'Empty closing tag name.', 2));
    return;
  }
  if (stack.length === 0) {
    var pc2 = C.posAt(src, tagStart);
    issues.push(C.issue('error', pc2.line, pc2.column,
      'Unexpected closing tag </' + cname + '>.', cname.length + 3));
    return;
  }
  var top = stack[stack.length - 1];
  if (top.name !== cname) {
    var pc3 = C.posAt(src, tagStart);
    issues.push(C.issue('error', pc3.line, pc3.column,
      'Mismatched closing tag </' + cname + '>; expected </' + top.name + '>.',
      cname.length + 3));
    return;
  }
  stack.pop();
}

function mvXmlHandleOpenTag(src, tagStart, raw, stack, issues) {
  var C = MVValidateXmlCommon;
  var selfClose = /\/>\s*$/.test(raw) || /\/\s*$/.test(raw);
  var nameMatch = raw.match(/^([A-Za-z_:][\w.\-:]*)/);
  if (!nameMatch) {
    var pc4 = C.posAt(src, tagStart);
    issues.push(C.issue('error', pc4.line, pc4.column, 'Invalid element name in tag.', 1));
    return;
  }
  var name = nameMatch[1];
  var attrs = raw.substring(name.length);
  if (attrs.match(/[^=\s]=\s*([^"'\s][^\s>]*)/)) {
    var pc5 = C.posAt(src, tagStart);
    issues.push(C.issue('error', pc5.line, pc5.column,
      'Attribute value must be quoted in XML.', 1));
  }
  var unclosedQuote = mvXmlAttrsHaveUnclosedQuote(attrs);
  if (unclosedQuote) {
    var pc6 = C.posAt(src, tagStart);
    issues.push(C.issue('error', pc6.line, pc6.column, 'Unterminated attribute quotes.', 1));
  }
  if (!selfClose && !unclosedQuote) {
    stack.push({ name: name, offset: tagStart });
  }
}

function mvXmlHandleTag(src, i, len, stack, issues) {
  var C = MVValidateXmlCommon;
  var special = MVValidateXmlSkip.skipSpecial(src, i, len, issues);
  if (special < 0) return { next: i, stop: true };
  if (special > i) return { next: special, stop: false };

  var tagStart = i;
  var gt = src.indexOf('>', i + 1);
  if (gt < 0) {
    var p5 = C.posAt(src, i);
    issues.push(C.issue('error', p5.line, p5.column, 'Unterminated tag (missing ">").', 1));
    return { next: i, stop: true };
  }
  var raw = src.substring(i + 1, gt);
  if (raw.charAt(0) === '/') {
    mvXmlHandleCloseTag(src, tagStart, raw, stack, issues);
  } else {
    mvXmlHandleOpenTag(src, tagStart, raw, stack, issues);
  }
  return { next: gt + 1, stop: false };
}

MVValidateXmlTags.handleTag = mvXmlHandleTag;
