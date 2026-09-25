/**
 * Markup Validator — orchestrator for classic Dreamweaver.
 */
var MV_CORE_MARKUP_HTML = { html: 1, htm: 1, xhtml: 1 };
var MV_CORE_MARKUP_XML = { xml: 1, xsd: 1, xsl: 1, xslt: 1, svg: 1, rss: 1, atom: 1 };

function mvCoreGetExt(path) {
  var m = String(path || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function mvCoreDetectLanguageFromExt(ext) {
  if (MV_CORE_MARKUP_HTML[ext]) return 'html';
  if (MV_CORE_MARKUP_XML[ext]) return 'xml';
  return 'unknown';
}

function mvCoreDetectLanguage(path, hint) {
  if (hint === 'html' || hint === 'xml') return hint;
  return mvCoreDetectLanguageFromExt(mvCoreGetExt(path));
}

function mvCoreHasLiveSource(dom) {
  return dom && dom.source && dom.source.getText;
}

function mvCoreReadLiveSource(dom) {
  if (!mvCoreHasLiveSource(dom)) return '';
  try {
    var live = dom.source.getText(0, 2147483647);
    if (live == null || live === '') return '';
    return String(live);
  } catch (e0) {
    return '';
  }
}

function mvCoreCanReadDisk(url) {
  if (!url) return false;
  if (typeof DWfile === 'undefined') return false;
  return DWfile.exists(url);
}

function mvCoreReadDiskSource(dom) {
  var url = dom.URL;
  if (!mvCoreCanReadDisk(url)) return '';
  try {
    var t = DWfile.read(url);
    if (t == null || t === '') return '';
    return String(t);
  } catch (e) {
    return '';
  }
}

function mvCoreReadOuterHtml(dom) {
  if (!dom.documentElement || !dom.documentElement.outerHTML) return '';
  try {
    return String(dom.documentElement.outerHTML);
  } catch (e2) {
    return '';
  }
}

function mvCoreGetDocumentSource(dom) {
  if (!dom) return '';
  var live = mvCoreReadLiveSource(dom);
  if (live) return live;
  var disk = mvCoreReadDiskSource(dom);
  if (disk) return disk;
  return mvCoreReadOuterHtml(dom);
}

function mvCoreReadDomTitle(dom) {
  try {
    if (dom.getTitle) return dom.getTitle() || '';
  } catch (e) { /* ignore */ }
  return '';
}

function mvCoreTitleFromPath(path) {
  if (!path) return '';
  var parts = String(path).replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}

function mvCoreGuessLanguageFromSample(dom) {
  var sample = mvCoreGetDocumentSource(dom).substring(0, 200).toLowerCase();
  if (sample.indexOf('<?xml') >= 0) return 'xml';
  if (sample.indexOf('<svg') >= 0) return 'xml';
  return 'html';
}

function mvCoreResolveTitle(dom, path) {
  var title = mvCoreReadDomTitle(dom);
  if (title) return title;
  if (path) return mvCoreTitleFromPath(path);
  return 'Untitled';
}

function mvCoreFillActiveInfoFromDom(info, dom) {
  info.ok = true;
  info.path = dom.URL || '';
  info.title = mvCoreResolveTitle(dom, info.path);
  try { info.isDirty = !!dom.getIsDirty(); } catch (e2) { /* ignore */ }
  info.language = mvCoreDetectLanguage(info.path, '');
  if (info.language === 'unknown') info.language = mvCoreGuessLanguageFromSample(dom);
}

function mvCoreGetActiveInfo() {
  var info = {
    ok: false,
    path: '',
    title: '',
    language: 'unknown',
    isDirty: false,
    error: ''
  };
  try {
    var dom = dw.getDocumentDOM();
    if (!dom) {
      info.error = 'No active document.';
      return info;
    }
    mvCoreFillActiveInfoFromDom(info, dom);
  } catch (e3) {
    info.error = String(e3 && e3.message ? e3.message : e3);
  }
  return info;
}

function mvCoreRunEngine(text, lang, settings) {
  if (lang === 'xml') return MVValidateXml.validate(text);
  return MVValidateHtml.validate(text, {
    includeWarnings: settings.includeWarnings !== false,
    suppressDoctype: !!settings.suppressDoctype
  });
}

function mvCoreIsDoctypeWarning(item) {
  if (item.ruleId === 'doctype') return true;
  return String(item.message || '').indexOf('DOCTYPE') >= 0;
}

function mvCoreIsWarningLike(item) {
  return item.severity === 'warning' || item.severity === 'info';
}

function mvCoreIsSuppressedDoctypeWarning(item, settings) {
  if (!settings.suppressDoctype) return false;
  if (item.severity !== 'warning') return false;
  return mvCoreIsDoctypeWarning(item);
}

function mvCoreShouldDropIssue(item, settings) {
  if (!settings.includeWarnings && mvCoreIsWarningLike(item)) return true;
  return mvCoreIsSuppressedDoctypeWarning(item, settings);
}

function mvCoreCountSeverities(issues) {
  var ec = 0;
  var wc = 0;
  var i;
  for (i = 0; i < issues.length; i++) {
    if (issues[i].severity === 'error') ec++;
    else if (issues[i].severity === 'warning') wc++;
  }
  return { errorCount: ec, warningCount: wc };
}

function mvCoreNeedsIssueFilter(settings) {
  return !!settings.suppressDoctype || settings.includeWarnings === false;
}

function mvCoreFilterValidatedIssues(result, settings) {
  if (!mvCoreNeedsIssueFilter(settings)) return result;
  var filtered = [];
  var i;
  for (i = 0; i < result.issues.length; i++) {
    if (!mvCoreShouldDropIssue(result.issues[i], settings)) filtered.push(result.issues[i]);
  }
  var counts = mvCoreCountSeverities(filtered);
  result.issues = filtered;
  result.errorCount = counts.errorCount;
  result.warningCount = counts.warningCount;
  result.ok = counts.errorCount === 0;
  return result;
}

function mvCoreValidateText(text, language, settings) {
  settings = settings || (typeof MVPrefs !== 'undefined' ? MVPrefs.load() : {});
  var result = mvCoreRunEngine(text, language || 'html', settings);
  result = mvCoreFilterValidatedIssues(result, settings);
  if (settings.warningsFail && result.warningCount > 0) result.ok = false;
  return result;
}

function mvCoreEmptyDocumentResult(info) {
  return {
    ok: false,
    issues: [],
    errorCount: 0,
    warningCount: 0,
    engine: 'none',
    language: 'unknown',
    file: '',
    title: '',
    error: info.error || 'No active document.'
  };
}

function mvCoreValidateActiveDocument(settings) {
  settings = settings || (typeof MVPrefs !== 'undefined' ? MVPrefs.load() : {});
  var info = mvCoreGetActiveInfo();
  if (!info.ok) return mvCoreEmptyDocumentResult(info);
  var text = mvCoreGetDocumentSource(dw.getDocumentDOM());
  var result = mvCoreValidateText(text, info.language, settings);
  result.file = info.path;
  result.title = info.title;
  return result;
}

function mvCoreShowFloater() {
  try {
    dw.setFloaterVisibility('Markup Validator', true);
  } catch (e) { /* ignore */ }
}

var MVCore = {
  getActiveInfo: mvCoreGetActiveInfo,
  getDocumentSource: mvCoreGetDocumentSource,
  validateActiveDocument: mvCoreValidateActiveDocument,
  validateText: mvCoreValidateText,
  detectLanguage: mvCoreDetectLanguage,
  showFloater: mvCoreShowFloater
};
