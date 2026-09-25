/**
 * Floater issue list rendering and selection.
 */
function mvFloaterSuppressDoctypeOn() {
  try { return !!mvFloaterCurrentSettings().suppressDoctype; } catch (e) { return false; }
}

function mvFloaterFilteredIssues() {
  var L = MVFloaterLib;
  if (!MVFloaterState.lastResult || !MVFloaterState.lastResult.issues) return [];
  var showE = mvFloater$('filterErrors') ? mvFloater$('filterErrors').checked : true;
  var showW = mvFloater$('filterWarnings') ? mvFloater$('filterWarnings').checked : true;
  return L.filterIssues(MVFloaterState.lastResult.issues, showE, showW, mvFloaterSuppressDoctypeOn());
}

function mvFloaterRenderEmptyList(list) {
  var L = MVFloaterLib;
  list.options[0] = new Option(L.emptyListMessage(MVFloaterState.uiState, MVFloaterState.lastResult), '');
}

function mvFloaterVisibleIssues() {
  if (MVFloaterState.uiState === 'busy') return [];
  if (MVFloaterState.uiState === 'none') return [];
  return mvFloaterFilteredIssues();
}

function mvFloaterUpdateSummary() {
  var L = MVFloaterLib;
  var summary = mvFloater$('summary');
  if (!summary) return;
  summary.innerHTML = L.summaryHtml(MVFloaterState.uiState, MVFloaterState.lastResult);
}

function mvFloaterPaintIssueList(issues) {
  var L = MVFloaterLib;
  var list = L.issueList(mvFloater$);
  if (!list) return;
  MVFloaterState.suppressListEvent = true;
  try { L.clearOptions(list); } catch (eClr) { /* ignore */ }
  if (!issues.length) mvFloaterRenderEmptyList(list);
  else try { L.fillIssueList(list, issues, MVFloaterState.selectedIndex); } catch (eFill) { /* ignore */ }
  MVFloaterState.suppressListEvent = false;
}

function mvFloaterRender() {
  var issues = mvFloaterVisibleIssues();
  mvFloaterUpdateSummary();
  mvFloaterPaintIssueList(issues);
}

function mvFloaterNavigateToIssue(issue) {
  if (!issue) return;
  try { MVNavigate.openIssueFile(issue); } catch (eOpen) { /* ignore */ }
  try { MVNavigate.goToIssue(issue); } catch (eNav) { /* ignore */ }
}

function mvFloaterSelectIssue(index) {
  var issues = mvFloaterFilteredIssues();
  if (isNaN(index) || index < 0 || index >= issues.length) return;
  MVFloaterState.selectedIndex = index;
  mvFloaterNavigateToIssue(issues[index]);
}

function mvFloaterOnIssueListClickDeferred() {
  if (MVFloaterState.suppressListEvent) return;
  var list = MVFloaterLib.issueList(mvFloater$);
  if (!list || list.selectedIndex < 0) return;
  if (!list.options || !list.options[list.selectedIndex]) return;
  var val = list.options[list.selectedIndex].value;
  if (val === '' || val == null) return;
  mvFloaterSelectIssue(parseInt(val, 10));
}

function mvFloaterOnIssueListClick() {
  if (MVFloaterState.suppressListEvent) return;
  setTimeout(mvFloaterOnIssueListClickDeferred, 0);
}

function mvFloaterResetToNotValidated(detail) {
  MVFloaterState.lastResult = null;
  MVFloaterState.selectedIndex = -1;
  mvFloaterSetState('none', detail || 'This document has not been checked.');
  mvFloaterRender();
}

function mvFloaterResultIsNoDocument(result) {
  return !!(result.error && String(result.error).indexOf('No active document') >= 0);
}

function mvFloaterChromeFromResult(result, counts) {
  var L = MVFloaterLib;
  if (result.error) return { kind: 'fail', detail: result.error };
  if (counts.errors === 0) {
    return { kind: 'ok', detail: L.detailFromCounts(0, counts.warnings) };
  }
  return { kind: 'fail', detail: L.detailFromCounts(counts.errors, counts.warnings) };
}

function mvFloaterApplyResult(result) {
  var L = MVFloaterLib;
  MVFloaterState.lastResult = result;
  MVFloaterState.selectedIndex = -1;
  if (!result) {
    mvFloaterResetToNotValidated();
    return;
  }
  if (mvFloaterResultIsNoDocument(result)) {
    mvFloaterResetToNotValidated(result.error);
    return;
  }
  var chrome = mvFloaterChromeFromResult(result, L.countShownSeverities(mvFloaterFilteredIssues()));
  mvFloaterSetState(chrome.kind, chrome.detail);
  mvFloaterRender();
}
