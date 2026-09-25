/**
 * Markup Validator — XML well-formedness checks (pure JS, Dreamweaver-safe).
 */
var MVValidateXml = {};

function mvXmlValidate(text) {
  var C = MVValidateXmlCommon;
  var src = String(text || '');
  if (C.isBlank(src)) return C.emptyResult();
  var issues = [];
  MVValidateXmlScan.scanDocument(src, issues);
  return C.buildResult(issues);
}

MVValidateXml.validate = mvXmlValidate;
