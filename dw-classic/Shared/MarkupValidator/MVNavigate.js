/**
 * Markup Validator — navigate to line/column in Code view.
 */
function mvNavReadSourceBuffer(dom) {
  if (!dom || !dom.source || !dom.source.getText) return '';
  try {
    var text = dom.source.getText(0, 2147483647);
    return text ? String(text) : '';
  } catch (e) { return ''; }
}

function mvNavReadAnySource(dom) {
  if (typeof MVCore !== 'undefined' && MVCore.getDocumentSource) {
    return MVCore.getDocumentSource(dom);
  }
  return mvNavReadSourceBuffer(dom);
}

function mvNavEnsureCodeView(dom) {
  if (!dom.setView || !dom.getView) return;
  try {
    var view = String(dom.getView() || '');
    if (view !== 'code' && view !== 'split') dom.setView('code');
  } catch (e) { /* ignore */ }
}

function mvNavSyncSource(dom) {
  try {
    if (dom.source && dom.source.synchronizeDocument) dom.source.synchronizeDocument();
  } catch (e2) { /* ignore */ }
}

function mvNavShowCode(dom) {
  mvNavEnsureCodeView(dom);
  mvNavSyncSource(dom);
}

function mvNavLineApiStart(dom, ln) {
  if (dom.source && dom.source.getOffsetFromLine) return dom.source.getOffsetFromLine(ln);
  if (typeof dom.getOffsetFromLine === 'function') return dom.getOffsetFromLine(ln);
  return -1;
}

function mvNavOffsetFromLineApi(dom, line, column) {
  var ln = Math.max(1, parseInt(line, 10) || 1);
  var col = Math.max(1, parseInt(column, 10) || 1);
  var start = -1;
  try { start = mvNavLineApiStart(dom, ln); } catch (e) { start = -1; }
  if (start < 0) return -1;
  return start + (col - 1);
}

function mvNavTokenLength(snippet, explicitLength) {
  var n = parseInt(explicitLength, 10) || 0;
  if (n > 0) return n;
  var m = String(snippet || '').match(/^<\/?[A-Za-z][^>\s]*|^[^\s<>]{1,40}/);
  if (m && m[0].length) return m[0].length;
  return 1;
}

function mvNavActivateDom(dom) {
  try {
    if (typeof dw.setActiveWindow === 'function') dw.setActiveWindow(dom);
  } catch (eAct) { /* ignore */ }
}

function mvNavSetCurrentLine(dom, line) {
  try {
    if (dom.source && dom.source.setCurrentLine) dom.source.setCurrentLine(line);
  } catch (eLine) { /* ignore */ }
}

function mvNavApplyDomSelection(dom, start, end) {
  try { dom.setSelection(start, end); } catch (eSel) { /* ignore */ }
}

function mvNavNudgeColumn(dom, line, column) {
  if (column <= 1 || !dom.source || !dom.source.arrowRight) return;
  try {
    dom.source.setCurrentLine(line);
    dom.source.arrowRight(column - 1, false);
  } catch (eCol) { /* ignore */ }
}

function mvNavParseIssueLine(issue) {
  return Math.max(1, parseInt(issue && issue.line, 10) || 1);
}

function mvNavParseIssueColumn(issue) {
  return Math.max(1, parseInt(issue && issue.column, 10) || 1);
}

function mvNavParseIssueLocation(issue) {
  return {
    line: mvNavParseIssueLine(issue),
    column: mvNavParseIssueColumn(issue),
    length: parseInt(issue && issue.length, 10) || 0
  };
}

function mvNavStartOffset(dom, loc) {
  var start = mvNavOffsetFromLineApi(dom, loc.line, loc.column);
  if (start >= 0) return { start: start, src: '' };
  var src = mvNavReadAnySource(dom);
  return {
    start: MVSharedText.lineColToOffset(src, loc.line, loc.column),
    src: src
  };
}

function mvNavSelectionRange(dom, issue) {
  var loc = mvNavParseIssueLocation(issue);
  var offsets = mvNavStartOffset(dom, loc);
  var snippet = offsets.src ? offsets.src.substring(offsets.start, offsets.start + 80) : '';
  var end = offsets.start + mvNavTokenLength(snippet, loc.length);
  return { line: loc.line, column: loc.column, start: offsets.start, end: end };
}

function mvNavIssueFileExists(file) {
  if (typeof DWfile === 'undefined') return false;
  return DWfile.exists(file);
}

function mvNavOpenIssueFile(issue) {
  if (!issue || !issue.file) return;
  if (!mvNavIssueFileExists(issue.file)) return;
  var dom = dw.getDocumentDOM();
  if (!dom || !dom.URL) {
    dw.openDocument(issue.file);
    return;
  }
  if (String(dom.URL) !== issue.file) dw.openDocument(issue.file);
}

function mvNavGoToIssue(issue) {
  try {
    var dom = dw.getDocumentDOM();
    if (!dom) return false;
    mvNavShowCode(dom);
    mvNavActivateDom(dom);
    var range = mvNavSelectionRange(dom, issue);
    mvNavSetCurrentLine(dom, range.line);
    mvNavApplyDomSelection(dom, range.start, range.end);
    mvNavNudgeColumn(dom, range.line, range.column);
    return true;
  } catch (e) {
    return false;
  }
}

var MVNavigate = {
  goToIssue: mvNavGoToIssue,
  openIssueFile: mvNavOpenIssueFile,
  lineColToOffset: MVSharedText.lineColToOffset
};
