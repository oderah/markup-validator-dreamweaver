/**
 * XML document scanner for MVValidateXml.
 */
var MVValidateXmlScan = {};

function mvXmlScanEntity(src, i, issues) {
  var C = MVValidateXmlCommon;
  if (src.charAt(i) !== '&') return i + 1;
  var ent = src.substring(i).match(/^&(#\d+|#x[0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9._:-]*);/);
  if (!ent) {
    var pe = C.posAt(src, i);
    issues.push(C.issue('error', pe.line, pe.column, 'Unescaped "&" or invalid character entity.', 1));
    return i + 1;
  }
  return i + ent[0].length;
}

function mvXmlFlushStack(src, stack, issues) {
  var C = MVValidateXmlCommon;
  var s;
  for (s = stack.length - 1; s >= 0; s--) {
    var open = stack[s];
    var po = C.posAt(src, open.offset);
    issues.push(C.issue('error', po.line, po.column,
      'Unclosed element <' + open.name + '>.', open.name.length + 2));
  }
}

function mvXmlScanDocument(src, issues) {
  var stack = [];
  var i = 0;
  var len = src.length;

  while (i < len) {
    if (src.charAt(i) === '<') {
      var tag = MVValidateXmlTags.handleTag(src, i, len, stack, issues);
      if (tag.stop) break;
      i = tag.next;
      continue;
    }
    i = mvXmlScanEntity(src, i, issues);
  }

  mvXmlFlushStack(src, stack, issues);
}

MVValidateXmlScan.scanDocument = mvXmlScanDocument;
