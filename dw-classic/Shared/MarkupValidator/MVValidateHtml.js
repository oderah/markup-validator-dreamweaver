/**
 * Markup Validator — practical HTML checks (pure JS, not full Nu HTML Checker).
 */
var MVValidateHtml = {};

function mvHtmlValidate(text, options) {
  var C = MVValidateHtmlCommon;
  options = options || {};
  var includeWarnings = options.includeWarnings !== false;
  var suppressDoctype = !!options.suppressDoctype;
  var issues = [];
  var src = String(text || '');
  var lower = src.toLowerCase();

  if (C.isBlank(src)) {
    return C.buildResult([C.issue('error', 1, 1, 'Document is empty.', 0, 'empty')], 'html');
  }

  if (includeWarnings && !suppressDoctype && lower.indexOf('<!doctype') < 0) {
    issues.push(C.issue('warning', 1, 1, 'Missing <!DOCTYPE> declaration.', 0, 'doctype'));
  }

  MVValidateHtmlAttrs.runAttributeChecks(src, issues, includeWarnings);
  MVValidateHtmlScan.scanTags(src, issues, includeWarnings);

  return C.buildResult(issues, 'html');
}

MVValidateHtml.validate = mvHtmlValidate;
