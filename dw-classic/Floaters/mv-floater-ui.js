/**
 * Floater chrome, settings UI, and document label helpers.
 */
function mvFloater$(id) {
  return document.getElementById(id);
}

function mvFloaterPaintStateChrome(kind) {
  var chrome = mvFloater$('chrome');
  if (chrome) chrome.className = 'chrome status-' + kind;
  var label = MVFloaterStateLabels[kind] || MVFloaterStateLabels.none;
  if (mvFloater$('stateBanner')) mvFloater$('stateBanner').innerHTML = label;
  if (mvFloater$('stateIcon')) mvFloater$('stateIcon').src = 'MarkupValidator/status-' + kind + '.png';
}

function mvFloaterSetState(kind, detail) {
  MVFloaterState.uiState = kind;
  mvFloaterPaintStateChrome(kind);
  if (mvFloater$('statusText')) mvFloater$('statusText').innerHTML = MVFloaterLib.displayHtml(detail || '');
}

function mvFloaterUpdateDocLabel() {
  var info = MVCore.getActiveInfo();
  if (mvFloater$('docName')) {
    mvFloater$('docName').innerHTML = MVFloaterLib.displayHtml(info.title || info.path || 'No document');
  }
}

function mvFloaterDefaultSettings() {
  return {
    debounceMs: 1500,
    validateIdle: true,
    validateSave: true,
    includeWarnings: true,
    warningsFail: false,
    suppressDoctype: false
  };
}

function mvFloaterCurrentSettings() {
  try { return MVPrefs.load(); } catch (e) { return mvFloaterDefaultSettings(); }
}

function mvFloaterSettingsButtonEl() {
  try {
    if (document.mvForm && document.mvForm.mvSettingsBtn) return document.mvForm.mvSettingsBtn;
  } catch (e) { /* ignore */ }
  return null;
}

function mvFloaterOptionsFloaterVisible() {
  try { return !!dw.getFloaterVisibility('Markup Validator Options'); } catch (e2) { return false; }
}

function mvFloaterSyncSettingsButton() {
  var btn = mvFloaterSettingsButtonEl();
  if (!btn) return;
  btn.value = mvFloaterOptionsFloaterVisible() ? 'Close' : 'Settings';
}

function mvFloaterToggleSettings() {
  try { dw.toggleFloater('Markup Validator Options'); } catch (e) { /* ignore */ }
  setTimeout(mvFloaterSyncSettingsButton, 50);
}

function mvFloaterIsResizable() { return true; }
function mvFloaterGetDockingSide() { return 'left right'; }
function mvFloaterInitialPosition(w, h) {
  return 'left 320 ' + Math.min(h, 520);
}
function mvFloaterDisplayHelp() {
  alert('Markup Validator (classic): validates HTML/XML with built-in checks.\nClick an issue to jump in Code view.');
}
