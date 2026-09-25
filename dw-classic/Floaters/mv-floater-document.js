/**
 * Floater document polling, save detection, and lifecycle hooks.
 */
function mvFloaterSnapshotSourceHash() {
  var L = MVFloaterLib;
  try {
    var src = MVCore.getDocumentSource(dw.getDocumentDOM());
    return L.hashText(L.normalizeMarkup(src));
  } catch (e) { return ''; }
}

function mvFloaterOnSourceChanged(h) {
  MVFloaterState.lastSourceHash = h;
  if (!MVFloaterState.busy) mvFloaterResetToNotValidated('Document changed — not validated.');
  mvFloaterScheduleIdleValidate();
}

function mvFloaterOnDocumentEdited() {
  var h = mvFloaterSnapshotSourceHash();
  if (!h || h === MVFloaterState.lastSourceHash) return;
  mvFloaterOnSourceChanged(h);
}

function mvFloaterActiveUrl() {
  try {
    var dom = dw.getDocumentDOM();
    return dom && dom.URL ? String(dom.URL) : '';
  } catch (e) { return ''; }
}

function mvFloaterHasDwFile(url) {
  if (!url) return false;
  return typeof DWfile !== 'undefined';
}

function mvFloaterReadMtime(url) {
  if (!mvFloaterHasDwFile(url)) return '';
  if (!DWfile.exists(url)) return '';
  try { return String(DWfile.getModificationDate(url) || ''); } catch (e) { return ''; }
}

function mvFloaterReadDiskHash(url) {
  if (!mvFloaterHasDwFile(url)) return '';
  if (!DWfile.exists(url)) return '';
  try { return MVFloaterLib.hashText(MVFloaterLib.normalizeMarkup(DWfile.read(url))); } catch (e) { return ''; }
}

function mvFloaterReadDirty() {
  try {
    var dom = dw.getDocumentDOM();
    if (!dom || !dom.getIsDirty) return null;
    return !!dom.getIsDirty();
  } catch (e) { return null; }
}

function mvFloaterNoteDocumentBaseline() {
  MVFloaterState.lastUrl = mvFloaterActiveUrl();
  MVFloaterState.lastMtime = mvFloaterReadMtime(MVFloaterState.lastUrl);
  var dirty = mvFloaterReadDirty();
  MVFloaterState.lastDirty = dirty === true;
  MVFloaterState.lastSourceHash = mvFloaterSnapshotSourceHash();
  var diskHash = mvFloaterReadDiskHash(MVFloaterState.lastUrl);
  MVFloaterState.hadUnsaved = MVFloaterState.lastDirty ||
    !!(diskHash && MVFloaterState.lastSourceHash && diskHash !== MVFloaterState.lastSourceHash);
}

function mvFloaterOnDocumentSwitched(prevUrl) {
  mvFloaterUpdateDocLabel();
  var becameNamed = (prevUrl === '' && MVFloaterState.lastUrl);
  mvFloaterNoteDocumentBaseline();
  if (becameNamed && mvFloaterCurrentSettings().validateSave) {
    mvFloaterCancelIdle();
    mvFloaterRunValidate('save');
    return;
  }
  mvFloaterCancelIdle();
  if (!MVFloaterState.busy) mvFloaterResetToNotValidated();
}

function mvFloaterUpdateDirtyState(dirty, mtime, diskHash, h) {
  if (mtime) MVFloaterState.lastMtime = mtime;
  if (dirty !== null) MVFloaterState.lastDirty = dirty;
  MVFloaterState.hadUnsaved = (dirty === true) || !!(diskHash && h && diskHash !== h);
}

function mvFloaterHandleSuppressDoctypeChange(settings) {
  var on = !!settings.suppressDoctype;
  if (on === MVFloaterState.lastSuppressDoctype) return;
  MVFloaterState.lastSuppressDoctype = on;
  if (MVFloaterState.busy || !MVFloaterState.lastResult) return;
  mvFloaterApplyResult(MVFloaterState.lastResult);
  mvFloaterRunValidate('settings');
}

function mvFloaterPollUrlChange(url) {
  if (url === MVFloaterState.lastUrl) return false;
  var prevUrl = MVFloaterState.lastUrl;
  MVFloaterState.lastUrl = url;
  mvFloaterOnDocumentSwitched(prevUrl);
  return true;
}

function mvFloaterPollSaveEvent(h, dirty, mtime, diskHash, settings) {
  var L = MVFloaterLib;
  var saved = L.detectSaveEvent(
    MVFloaterState.lastDirty, dirty, MVFloaterState.hadUnsaved, diskHash, h, mtime, MVFloaterState.lastMtime
  );
  mvFloaterUpdateDirtyState(dirty, mtime, diskHash, h);
  if (!saved || !settings.validateSave) return false;
  MVFloaterState.lastSourceHash = h;
  mvFloaterCancelIdle();
  mvFloaterRunValidate('save');
  return true;
}

function mvFloaterPollDocument() {
  var url = mvFloaterActiveUrl();
  if (mvFloaterPollUrlChange(url)) return;
  var h = mvFloaterSnapshotSourceHash();
  var dirty = mvFloaterReadDirty();
  var mtime = mvFloaterReadMtime(url);
  var diskHash = mvFloaterReadDiskHash(url);
  var settings = mvFloaterCurrentSettings();
  if (mvFloaterPollSaveEvent(h, dirty, mtime, diskHash, settings)) return;
  mvFloaterHandleSuppressDoctypeChange(settings);
  if (MVFloaterState.busy) return;
  if (h && h !== MVFloaterState.lastSourceHash) mvFloaterOnSourceChanged(h);
}

function mvFloaterPollCommandFlag() {
  try {
    if (typeof MVTrigger !== 'undefined' && MVTrigger.consumeIfPresent()) mvFloaterRunValidate();
  } catch (e) { /* ignore */ }
}

function mvFloaterPanelOnLoad() {
  mvFloaterUpdateDocLabel();
  mvFloaterNoteDocumentBaseline();
  try { MVFloaterState.lastSuppressDoctype = !!mvFloaterCurrentSettings().suppressDoctype; } catch (ePref) { /* ignore */ }
  mvFloaterResetToNotValidated();
  mvFloaterSyncSettingsButton();
  setInterval(function () {
    mvFloaterPollDocument();
    mvFloaterPollCommandFlag();
    mvFloaterSyncSettingsButton();
  }, 400);
}

function mvFloaterSelectionChanged() {
  var url = mvFloaterActiveUrl();
  if (url !== MVFloaterState.lastUrl) {
    var prevUrl = MVFloaterState.lastUrl;
    MVFloaterState.lastUrl = url;
    mvFloaterOnDocumentSwitched(prevUrl);
    return;
  }
  mvFloaterUpdateDocLabel();
}
