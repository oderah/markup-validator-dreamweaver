/**
 * Markup Validator floater — UI and document-poll helpers (low complexity).
 */
function mvFloaterLibEsc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mvFloaterLibBasename(p) {
  var s = String(p || '').replace(/\\/g, '/');
  var i = s.lastIndexOf('/');
  return i >= 0 ? s.substring(i + 1) : s;
}

function mvFloaterLibHashText(s) {
  var h = 0;
  var i;
  var str = String(s || '');
  for (i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return String(h) + ':' + str.length;
}

function mvFloaterLibNormalizeMarkup(s) {
  return String(s || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function mvFloaterLibSeverityTag(sev) {
  if (sev === 'error') return '[Error]';
  if (sev === 'warning') return '[Warn] ';
  return '[Info] ';
}

function mvFloaterLibLineLocation(it) {
  var loc = 'Line ' + (it.line || '?');
  if (it.column) loc += ', col ' + it.column;
  return loc;
}

function mvFloaterLibIssueOptionLabel(it) {
  var tag = mvFloaterLibSeverityTag(it.severity || 'error').replace(/\s+$/, '');
  var message = String(it.message || '').replace(/\s+/g, ' ');
  var label = tag + ' ' + message;
  if (label.length <= 48) return label;
  return label.substring(0, 45) + '...';
}

function mvFloaterLibMissingDoctypeWarning(issue) {
  if (!issue || issue.severity === 'error') return false;
  if (issue.ruleId === 'doctype') return true;
  return String(issue.message || '').toLowerCase().indexOf('doctype') >= 0;
}

function mvFloaterLibIssuePassesFilters(issue, showE, showW, hideDoctype) {
  if (hideDoctype && mvFloaterLibMissingDoctypeWarning(issue)) return false;
  var sev = issue.severity;
  if (sev === 'error') return showE;
  if (sev === 'warning') return showW;
  return showE;
}

function mvFloaterLibSavedFromDirty(lastDirty, dirty) {
  return lastDirty === true && dirty === false;
}

function mvFloaterLibSavedFromDiskMatch(hadUnsaved, diskHash, h) {
  if (!hadUnsaved || !diskHash || !h) return false;
  return h === diskHash;
}

function mvFloaterLibCanonicalUrl(url) {
  return String(url || '').replace(/\\/g, '/').replace(/^file:\/\/\/([a-zA-Z])\|/i, 'file:///$1:');
}

function mvFloaterLibPushUnique(list, value) {
  if (!value) return;
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i] === value) return;
  }
  list.push(value);
}

function mvFloaterLibUrlVariants(url) {
  var raw = String(url || '');
  var list = [];
  mvFloaterLibPushUnique(list, raw);
  mvFloaterLibPushUnique(list, raw.replace(/^file:\/\/\/([a-zA-Z]):/i, 'file:///$1|'));
  mvFloaterLibPushUnique(list, mvFloaterLibCanonicalUrl(raw));
  return list;
}

function mvFloaterLibSavedFromMtimeChange(mtime, lastMtime) {
  if (!mtime || !lastMtime) return false;
  return mtime !== lastMtime;
}

function mvFloaterLibSavedFromSourceLanding(lastHash, h, diskHash) {
  if (!lastHash || !h || !diskHash) return false;
  if (h === lastHash) return false;
  return h === diskHash;
}

function mvFloaterLibDetectSaveEvent(lastDirty, dirty, hadUnsaved, diskHash, h, mtime, lastMtime, lastHash) {
  if (mvFloaterLibSavedFromDirty(lastDirty, dirty)) return true;
  if (mvFloaterLibSavedFromDiskMatch(hadUnsaved, diskHash, h)) return true;
  if (mvFloaterLibSavedFromMtimeChange(mtime, lastMtime)) return true;
  return mvFloaterLibSavedFromSourceLanding(lastHash, h, diskHash);
}

function mvFloaterLibCountShownSeverities(shown) {
  var errors = 0;
  var warnings = 0;
  var n;
  for (n = 0; n < shown.length; n++) {
    if (shown[n].severity === 'error') errors++;
    else if (shown[n].severity === 'warning') warnings++;
  }
  return { errors: errors, warnings: warnings };
}

function mvFloaterLibDetailFromCounts(errors, warnings) {
  if (errors !== 0) {
    var detail = errors + ' error(s)';
    if (warnings) detail += ', ' + warnings + ' warning(s)';
    return detail;
  }
  if (warnings) return 'No errors (' + warnings + ' warning(s)).';
  return 'No markup errors.';
}

function mvFloaterLibEmptyListMessage(uiState, lastResult) {
  if (uiState === 'busy') return 'Validating…';
  if (!lastResult) return 'This document has not been checked.';
  if (lastResult.ok) return 'No issues found.';
  if (lastResult.error) return lastResult.error;
  return 'No issues to display (check filters).';
}

function mvFloaterLibSummaryHtml(uiState, lastResult) {
  if (uiState === 'busy') return 'Validating…';
  if (uiState === 'none' || !lastResult) return 'Not validated';
  if (lastResult.error) return mvFloaterLibEsc(lastResult.error);
  return '<b>' + lastResult.errorCount + '</b> errors &nbsp;·&nbsp; <b>' +
    lastResult.warningCount + '</b> warnings';
}

function mvFloaterLibClearOptions(list) {
  if (list.options) {
    while (list.options.length > 0) list.options[0] = null;
    return;
  }
  list.innerHTML = '';
}

function mvFloaterLibListFromNamedForm() {
  try {
    return document.forms['mvForm'].issueList;
  } catch (e) { return null; }
}

function mvFloaterLibListFromMvForm() {
  try {
    return document.mvForm.issueList;
  } catch (e2) { return null; }
}

function mvFloaterLibIssueList(getById) {
  var list = getById('issueList');
  if (list) return list;
  list = mvFloaterLibListFromNamedForm();
  if (list) return list;
  return mvFloaterLibListFromMvForm();
}

function mvFloaterLibFilterIssues(issues, showE, showW, hideDoctype) {
  var out = [];
  var i;
  for (i = 0; i < issues.length; i++) {
    if (mvFloaterLibIssuePassesFilters(issues[i], showE, showW, hideDoctype)) out.push(issues[i]);
  }
  return out;
}

function mvFloaterLibIssueDetailHtml(issue) {
  if (!issue) return 'Select an issue to see its full description.';
  var sev = 'Error';
  if (issue.severity === 'warning') sev = 'Warning';
  else if (issue.severity === 'info') sev = 'Info';
  var loc = mvFloaterLibLineLocation(issue);
  if (issue.file) loc = mvFloaterLibBasename(issue.file) + ' \u2014 ' + loc;
  var meta = sev + ' \u00b7 ' + loc;
  if (issue.ruleId) meta += ' \u00b7 ' + issue.ruleId;
  return '<div class="issue-detail-meta">' + mvFloaterLibEsc(meta) + '</div>' +
    '<div class="issue-detail-message">' + mvFloaterLibEsc(issue.message) + '</div>';
}

function mvFloaterLibDisplayHtml(text) {
  var raw = String(text || '');
  var out = '';
  var sinceBreak = 0;
  var i;
  for (i = 0; i < raw.length; i++) {
    var ch = raw.charAt(i);
    out += mvFloaterLibEsc(ch);
    sinceBreak++;
    if (ch === '/' || ch === '\\' || ch === ' ' || ch === '-' || sinceBreak >= 16) {
      out += '<wbr>';
      sinceBreak = 0;
    }
  }
  return out;
}

function mvFloaterLibFillIssueRows(list, issues, selectedIndex) {
  var html = '';
  var i;
  for (i = 0; i < issues.length; i++) {
    var cls = i === selectedIndex ? 'issue-row issue-row-selected' : 'issue-row';
    html += '<div class="' + cls + '" onclick="mvFloaterSelectIssue(' + i + ')">' +
      mvFloaterLibDisplayHtml(mvFloaterLibIssueOptionLabel(issues[i])) + '</div>';
  }
  list.innerHTML = html;
}

function mvFloaterLibFillIssueList(list, issues, selectedIndex) {
  if (!list.options) {
    mvFloaterLibFillIssueRows(list, issues, selectedIndex);
    return;
  }
  var i;
  for (i = 0; i < issues.length; i++) {
    list.options[i] = new Option(mvFloaterLibIssueOptionLabel(issues[i]), String(i));
  }
  if (selectedIndex < 0 || selectedIndex >= issues.length) return;
  list.selectedIndex = selectedIndex;
}

var MVFloaterLib = {
  esc: mvFloaterLibEsc,
  basename: mvFloaterLibBasename,
  hashText: mvFloaterLibHashText,
  normalizeMarkup: mvFloaterLibNormalizeMarkup,
  canonicalUrl: mvFloaterLibCanonicalUrl,
  urlVariants: mvFloaterLibUrlVariants,
  issueOptionLabel: mvFloaterLibIssueOptionLabel,
  missingDoctypeWarning: mvFloaterLibMissingDoctypeWarning,
  issuePassesFilters: mvFloaterLibIssuePassesFilters,
  detectSaveEvent: mvFloaterLibDetectSaveEvent,
  countShownSeverities: mvFloaterLibCountShownSeverities,
  detailFromCounts: mvFloaterLibDetailFromCounts,
  emptyListMessage: mvFloaterLibEmptyListMessage,
  summaryHtml: mvFloaterLibSummaryHtml,
  clearOptions: mvFloaterLibClearOptions,
  issueList: mvFloaterLibIssueList,
  filterIssues: mvFloaterLibFilterIssues,
  fillIssueList: mvFloaterLibFillIssueList,
  issueDetailHtml: mvFloaterLibIssueDetailHtml,
  displayHtml: mvFloaterLibDisplayHtml
};
