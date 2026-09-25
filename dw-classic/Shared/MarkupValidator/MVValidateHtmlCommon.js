/**
 * Shared issue/result helpers for MVValidateHtml (requires MVSharedText).
 */
var MVValidateHtmlCommon = {
  VOID: {
    area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, keygen: 1,
    link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1
  },
  IMPLIED: { html: 1, body: 1, head: 1 }
};

function mvHtmlIssue(severity, line, column, message, length, ruleId) {
  return {
    severity: severity || 'error',
    line: line || 0,
    column: column || 0,
    message: message || '',
    length: length || 0,
    ruleId: ruleId || 'html'
  };
}

function mvHtmlPosAt(src, offset) {
  return MVSharedText.offsetToLineCol(src, offset);
}

function mvHtmlIsBlank(src) {
  return !String(src || '').replace(/^\uFEFF/, '').replace(/\s+/g, '');
}

function mvHtmlBuildResult(issues, language) {
  var errorCount = 0;
  var warningCount = 0;
  var k;
  for (k = 0; k < issues.length; k++) {
    if (issues[k].severity === 'warning') warningCount++;
    else if (issues[k].severity !== 'info') errorCount++;
  }
  return {
    ok: errorCount === 0,
    issues: issues,
    errorCount: errorCount,
    warningCount: warningCount,
    engine: 'js-html',
    language: language || 'html'
  };
}

function mvHtmlIsImpliedOpen(name) {
  return !!MVValidateHtmlCommon.IMPLIED[name];
}

MVValidateHtmlCommon.issue = mvHtmlIssue;
MVValidateHtmlCommon.posAt = mvHtmlPosAt;
MVValidateHtmlCommon.isBlank = mvHtmlIsBlank;
MVValidateHtmlCommon.buildResult = mvHtmlBuildResult;
MVValidateHtmlCommon.isImpliedOpen = mvHtmlIsImpliedOpen;
