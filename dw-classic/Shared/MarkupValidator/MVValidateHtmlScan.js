/**
 * HTML tag-stack scanner for MVValidateHtml.
 */
var MVValidateHtmlScan = {};

function mvHtmlScanTags(src, issues, includeWarnings) {
  var C = MVValidateHtmlCommon;
  var stack = [];
  var i = 0;
  var len = src.length;

  while (i < len) {
    if (src.charAt(i) !== '<') {
      i++;
      continue;
    }
    var special = MVValidateHtmlSkip.skipSpecialMarkup(src, i, issues);
    if (special < 0) break;
    if (special > i) {
      i = special;
      continue;
    }

    var tagStart = i;
    var gt = src.indexOf('>', i + 1);
    if (gt < 0) {
      var pg = C.posAt(src, i);
      issues.push(C.issue('error', pg.line, pg.column, 'Unterminated tag (missing ">").', 1, 'tag'));
      break;
    }
    var raw = src.substring(i + 1, gt);
    i = gt + 1;

    if (raw.charAt(0) === '!' || raw.charAt(0) === '?') continue;
    if (raw.charAt(0) === '/') {
      MVValidateHtmlStack.handleCloseTag(src, tagStart, raw, stack, issues, includeWarnings);
      continue;
    }
    MVValidateHtmlStack.handleOpenTag(src, tagStart, raw, stack, issues, includeWarnings);
  }

  MVValidateHtmlStack.flushOpenStack(src, stack, issues, includeWarnings);
}

MVValidateHtmlScan.scanTags = mvHtmlScanTags;
