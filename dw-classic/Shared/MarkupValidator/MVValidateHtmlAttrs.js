/**
 * Attribute-level HTML checks (duplicate ids, img alt, anchor href).
 */
var MVValidateHtmlAttrs = {};

function mvHtmlCheckDuplicateIds(src, issues) {
  var C = MVValidateHtmlCommon;
  var idRe = /\bid\s*=\s*["']([^"']+)["']/gi;
  var seenIds = {};
  var idm;
  while ((idm = idRe.exec(src))) {
    var idVal = idm[1];
    if (seenIds[idVal]) {
      var pDup = C.posAt(src, idm.index);
      issues.push(C.issue('error', pDup.line, pDup.column,
        'Duplicate id="' + idVal + '".', idm[0].length, 'dup-id'));
    } else {
      seenIds[idVal] = true;
    }
  }
}

function mvHtmlCheckImgAlt(src, issues) {
  var C = MVValidateHtmlCommon;
  var imgRe = /<img\b([^>]*)>/gi;
  var im;
  while ((im = imgRe.exec(src))) {
    if (!/\balt\s*=/i.test(im[1])) {
      var pi = C.posAt(src, im.index);
      issues.push(C.issue('warning', pi.line, pi.column,
        '<img> is missing an alt attribute.', 4, 'img-alt'));
    }
  }
}

function mvHtmlCheckAnchorHref(src, issues) {
  var C = MVValidateHtmlCommon;
  var aRe = /<a\b([^>]*)>/gi;
  var am;
  while ((am = aRe.exec(src))) {
    if (!/\bhref\s*=/i.test(am[1])) {
      var pa = C.posAt(src, am.index);
      issues.push(C.issue('warning', pa.line, pa.column,
        '<a> is missing an href attribute.', 2, 'a-href'));
    }
  }
}

function mvHtmlRunAttributeChecks(src, issues, includeWarnings) {
  mvHtmlCheckDuplicateIds(src, issues);
  if (!includeWarnings) return;
  mvHtmlCheckImgAlt(src, issues);
  mvHtmlCheckAnchorHref(src, issues);
}

MVValidateHtmlAttrs.runAttributeChecks = mvHtmlRunAttributeChecks;
