/**
 * Shared issue/result helpers for MVValidateXml (requires MVSharedText).
 */
var MVValidateXmlCommon = {};

function mvXmlIssue(severity, line, column, message, length) {
  return {
    severity: severity || 'error',
    line: line || 0,
    column: column || 0,
    message: message || '',
    length: length || 0,
    ruleId: 'xml-wf'
  };
}

function mvXmlPosAt(src, offset) {
  return MVSharedText.offsetToLineCol(src, offset);
}

function mvXmlIsBlank(src) {
  return !String(src || '').replace(/^\uFEFF/, '').replace(/\s+/g, '');
}

function mvXmlEmptyResult() {
  return {
    ok: false,
    issues: [mvXmlIssue('error', 1, 1, 'Document is empty.', 0)],
    errorCount: 1,
    warningCount: 0,
    engine: 'js-xml',
    language: 'xml'
  };
}

function mvXmlBuildResult(issues) {
  var errorCount = 0;
  var warningCount = 0;
  var k;
  for (k = 0; k < issues.length; k++) {
    if (issues[k].severity === 'warning') warningCount++;
    else errorCount++;
  }
  return {
    ok: errorCount === 0,
    issues: issues,
    errorCount: errorCount,
    warningCount: warningCount,
    engine: 'js-xml',
    language: 'xml'
  };
}

MVValidateXmlCommon.issue = mvXmlIssue;
MVValidateXmlCommon.posAt = mvXmlPosAt;
MVValidateXmlCommon.isBlank = mvXmlIsBlank;
MVValidateXmlCommon.emptyResult = mvXmlEmptyResult;
MVValidateXmlCommon.buildResult = mvXmlBuildResult;
