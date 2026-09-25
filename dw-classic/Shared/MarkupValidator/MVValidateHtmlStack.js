/**
 * HTML open/close tag stack handling for MVValidateHtml.
 */
var MVValidateHtmlStack = {};
var MV_HTML_VOID = MVValidateHtmlCommon.VOID;

function mvHtmlPushOrphanIssues(src, stack, si, cname, issues, includeWarnings) {
  var C = MVValidateHtmlCommon;
  var skipped;
  for (skipped = stack.length - 1; skipped > si; skipped--) {
    var orphan = stack[skipped];
    var poSkip = C.posAt(src, orphan.offset);
    var msg = 'Unclosed <' + orphan.name + '> before </' + cname + '>.';
    var len = orphan.name.length + 2;
    if (C.isImpliedOpen(orphan.name) && includeWarnings) {
      issues.push(C.issue('warning', poSkip.line, poSkip.column, msg, len, 'unclosed'));
    } else if (!C.isImpliedOpen(orphan.name)) {
      issues.push(C.issue('error', poSkip.line, poSkip.column, msg, len, 'unclosed'));
    }
  }
}

function mvHtmlHandleCloseTag(src, tagStart, raw, stack, issues, includeWarnings) {
  var C = MVValidateHtmlCommon;
  var cname = raw.substring(1).replace(/^\s+|\s+$/g, '').split(/[\s/]/)[0].toLowerCase();
  if (!cname || MV_HTML_VOID[cname]) return;
  var found = false;
  var si;
  for (si = stack.length - 1; si >= 0; si--) {
    if (stack[si].name !== cname) continue;
    found = true;
    mvHtmlPushOrphanIssues(src, stack, si, cname, issues, includeWarnings);
    stack.length = si;
    break;
  }
  if (!found) {
    var pcm = C.posAt(src, tagStart);
    issues.push(C.issue('error', pcm.line, pcm.column,
      'Unexpected closing tag </' + cname + '>.', cname.length + 3, 'mismatch'));
  }
}

function mvHtmlHandleOpenTag(src, tagStart, raw, stack, issues, includeWarnings) {
  var C = MVValidateHtmlCommon;
  var nameMatch = raw.match(/^([A-Za-z][\w:-]*)/);
  if (!nameMatch) return;
  var name = nameMatch[1].toLowerCase();
  var hasTrailingSlash = /\/\s*$/.test(raw);
  if (includeWarnings && hasTrailingSlash && MV_HTML_VOID[name]) {
    var pSlash = C.posAt(src, tagStart);
    issues.push(C.issue('warning', pSlash.line, pSlash.column,
      'Void element <' + name + '> does not need a trailing slash.',
      name.length + 2, 'void-slash'));
  }
  if (!hasTrailingSlash && !MV_HTML_VOID[name]) {
    stack.push({ name: name, offset: tagStart });
  }
}

function mvHtmlFlushOpenStack(src, stack, issues, includeWarnings) {
  var C = MVValidateHtmlCommon;
  var s;
  for (s = 0; s < stack.length; s++) {
    var open = stack[s];
    var po = C.posAt(src, open.offset);
    var len = open.name.length + 2;
    if (C.isImpliedOpen(open.name) && includeWarnings) {
      issues.push(C.issue('warning', po.line, po.column,
        'Unclosed <' + open.name + '> (may be implied by parser).', len, 'unclosed'));
    } else if (!C.isImpliedOpen(open.name)) {
      issues.push(C.issue('error', po.line, po.column,
        'Unclosed element <' + open.name + '>.', len, 'unclosed'));
    }
  }
}

MVValidateHtmlStack.handleCloseTag = mvHtmlHandleCloseTag;
MVValidateHtmlStack.handleOpenTag = mvHtmlHandleOpenTag;
MVValidateHtmlStack.flushOpenStack = mvHtmlFlushOpenStack;
