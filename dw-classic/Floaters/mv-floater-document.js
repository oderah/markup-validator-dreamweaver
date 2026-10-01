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

function mvFloaterRawUrl() {
  try {
    var dom = dw.getDocumentDOM();
    return dom && dom.URL ? String(dom.URL) : '';
  } catch (e) { return ''; }
}

function mvFloaterActiveUrl() {
  return MVFloaterLib.canonicalUrl(mvFloaterRawUrl());
}

function mvFloaterExistingFileUrl(url) {
  if (!url || typeof DWfile === 'undefined' || !DWfile.exists) return '';
  var variants = MVFloaterLib.urlVariants(url);
  var i;
  for (i = 0; i < variants.length; i++) {
    try {
      if (DWfile.exists(variants[i])) return variants[i];
    } catch (e) { /* ignore */ }
  }
  return '';
}

function mvFloaterReadMtime(url) {
  var fileUrl = mvFloaterExistingFileUrl(url);
  if (!fileUrl) return '';
  try { return String(DWfile.getModificationDate(fileUrl) || ''); } catch (e) { return ''; }
}

function mvFloaterReadDiskHash(url) {
  var fileUrl = mvFloaterExistingFileUrl(url);
  if (!fileUrl) return '';
  try { return MVFloaterLib.hashText(MVFloaterLib.normalizeMarkup(DWfile.read(fileUrl))); } catch (e) { return ''; }
}

function mvFloaterDirtyMethod(dom) {
  try {
    if (typeof dom.getIsDirty === 'function') return !!dom.getIsDirty();
    if (typeof dom.isDirty === 'function') return !!dom.isDirty();
  } catch (e) { /* ignore */ }
  return null;
}

function mvFloaterDirtyFromDom(dom) {
  if (!dom) return null;
  var fromMethod = mvFloaterDirtyMethod(dom);
  if (fromMethod !== null) return fromMethod;
  if (typeof dom.modified === 'boolean') return dom.modified;
  return null;
}

function mvFloaterReadDirty() {
  try { return mvFloaterDirtyFromDom(dw.getDocumentDOM()); } catch (e) { return null; }
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

function mvFloaterSameDocumentText(previousHash) {
  return !!(previousHash && previousHash === MVFloaterState.lastSourceHash);
}

function mvFloaterValidateBecauseSaved(prevUrl, previousHash) {
  if (!mvFloaterCurrentSettings().validateSave) return false;
  if (prevUrl === '' && MVFloaterState.lastUrl) return true;
  return mvFloaterSameDocumentText(previousHash);
}

function mvFloaterOnDocumentSwitched(prevUrl) {
  var previousHash = MVFloaterState.lastSourceHash;
  mvFloaterUpdateDocLabel();
  mvFloaterNoteDocumentBaseline();
  if (mvFloaterValidateBecauseSaved(prevUrl, previousHash)) {
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
  if (dirty === true) MVFloaterState.hadUnsaved = true;
  if (diskHash && h) MVFloaterState.hadUnsaved = dirty === true || diskHash !== h;
}

function mvFloaterResultSettingsKey(settings) {
  return (settings.includeWarnings ? '1' : '0') +
    (settings.warningsFail ? '1' : '0') +
    (settings.suppressDoctype ? '1' : '0');
}

function mvFloaterRememberResultSettings(settings) {
  MVFloaterState.lastResultSettingsKey = mvFloaterResultSettingsKey(settings);
}

function mvFloaterApplyLiveSettings(settings) {
  if (!settings.validateIdle) mvFloaterCancelIdle();
  var key = mvFloaterResultSettingsKey(settings);
  if (key === MVFloaterState.lastResultSettingsKey) return;
  mvFloaterRememberResultSettings(settings);
  if (MVFloaterState.busy || !MVFloaterState.lastResult) return;
  mvFloaterRunValidate('settings');
}

function mvFloaterPollUrlChange(url) {
  url = MVFloaterLib.canonicalUrl(url);
  if (url === MVFloaterState.lastUrl) return false;
  var prevUrl = MVFloaterState.lastUrl;
  MVFloaterState.lastUrl = url;
  mvFloaterOnDocumentSwitched(prevUrl);
  return true;
}

function mvFloaterPollSaveEvent(h, dirty, mtime, diskHash, settings) {
  var L = MVFloaterLib;
  var saved = L.detectSaveEvent(
    MVFloaterState.lastDirty, dirty, MVFloaterState.hadUnsaved, diskHash, h,
    mtime, MVFloaterState.lastMtime, MVFloaterState.lastSourceHash
  );
  mvFloaterUpdateDirtyState(dirty, mtime, diskHash, h);
  if (!saved || !settings.validateSave) return false;
  MVFloaterState.lastSourceHash = h;
  mvFloaterCancelIdle();
  mvFloaterRunValidate('save');
  return true;
}

function mvFloaterCheckForSave() {
  var url = mvFloaterActiveUrl();
  var h = mvFloaterSnapshotSourceHash();
  var diskHash = '';
  if (h && h !== MVFloaterState.lastSourceHash) diskHash = mvFloaterReadDiskHash(url);
  return mvFloaterPollSaveEvent(
    h,
    mvFloaterReadDirty(),
    mvFloaterReadMtime(url),
    diskHash,
    mvFloaterCurrentSettings()
  );
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
  mvFloaterApplyLiveSettings(settings);
  if (MVFloaterState.busy) return;
  if (h && h !== MVFloaterState.lastSourceHash) mvFloaterOnSourceChanged(h);
}

function mvFloaterPollCommandFlag() {
  try {
    if (typeof MVTrigger !== 'undefined' && MVTrigger.consumeIfPresent()) mvFloaterRunValidate();
  } catch (e) { /* ignore */ }
}

function mvFloaterAfterHostSave() {
  if (!mvFloaterCurrentSettings().validateSave) return;
  mvFloaterNoteDocumentBaseline();
  mvFloaterCancelIdle();
  mvFloaterRunValidate('save');
}

function mvFloaterCallOriginalSave(original, args) {
  try { return original.apply(dw, args); } catch (e) { return original(args[0]); }
}

function mvFloaterWrapSave(name) {
  var original = dw[name];
  if (typeof original !== 'function' || original._mvWrapped) return;
  function wrapped() {
    var result = mvFloaterCallOriginalSave(original, arguments);
    try { mvFloaterAfterHostSave(); } catch (e) { /* ignore */ }
    return result;
  }
  wrapped._mvWrapped = true;
  try { dw[name] = wrapped; } catch (e2) { /* host method is read-only */ }
}

function mvFloaterInstallSaveHook() {
  if (!dw) return;
  mvFloaterWrapSave('saveDocument');
  mvFloaterWrapSave('saveAll');
  mvFloaterWrapSave('saveDocumentAs');
  mvFloaterWrapSave('saveFrameset');
}

function mvFloaterPanelOnLoad() {
  mvFloaterUpdateDocLabel();
  mvFloaterNoteDocumentBaseline();
  try { mvFloaterRememberResultSettings(mvFloaterCurrentSettings()); } catch (ePref) { /* ignore */ }
  mvFloaterResetToNotValidated();
  mvFloaterSyncSettingsButton();
  setInterval(function () {
    mvFloaterPollDocument();
    mvFloaterPollCommandFlag();
    mvFloaterSyncSettingsButton();
  }, 400);
}

function mvFloaterSelectionChanged() {
  if (mvFloaterPollUrlChange(mvFloaterActiveUrl())) return;
  mvFloaterUpdateDocLabel();
}
