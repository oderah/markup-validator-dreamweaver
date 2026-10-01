/**
 * Floater validation runs and idle debounce.
 */
function mvFloaterValidationErrorFromException(e) {
  return {
    ok: false,
    issues: [],
    errorCount: 0,
    warningCount: 0,
    error: String(e && e.message ? e.message : e)
  };
}

function mvFloaterFinishValidateRun() {
  MVFloaterState.busy = false;
  if (!MVFloaterState.pendingSave) return;
  MVFloaterState.pendingSave = false;
  mvFloaterRunValidate('save');
}

function mvFloaterDocumentChangedDuringValidate(nowHash) {
  if (!nowHash || !MVFloaterState.startedHash) return false;
  return nowHash !== MVFloaterState.startedHash;
}

function mvFloaterApplyValidateOutcome(result, nowHash) {
  if (mvFloaterDocumentChangedDuringValidate(nowHash)) {
    MVFloaterState.lastSourceHash = nowHash;
    mvFloaterResetToNotValidated('Document changed — not validated.');
    mvFloaterScheduleIdleValidate();
    return;
  }
  MVFloaterState.lastSourceHash = nowHash || MVFloaterState.startedHash;
  mvFloaterApplyResult(result);
}

function mvFloaterRunValidateWork() {
  var result = MVCore.validateActiveDocument(mvFloaterCurrentSettings());
  mvFloaterApplyValidateOutcome(result, mvFloaterSnapshotSourceHash());
}

function mvFloaterRunValidate(reason) {
  if (MVFloaterState.busy) {
    if (reason === 'save') MVFloaterState.pendingSave = true;
    return;
  }
  MVFloaterState.busy = true;
  MVFloaterState.pendingSave = false;
  MVFloaterState.startedUrl = mvFloaterActiveUrl();
  MVFloaterState.startedHash = mvFloaterSnapshotSourceHash();
  MVFloaterState.lastSourceHash = MVFloaterState.startedHash;
  mvFloaterUpdateDocLabel();
  MVFloaterState.lastResult = null;
  MVFloaterState.selectedIndex = -1;
  mvFloaterSetState('busy', 'Checking markup…');
  mvFloaterRender();

  setTimeout(function () {
    try {
      if (mvFloaterActiveUrl() !== MVFloaterState.startedUrl) {
        MVFloaterState.busy = false;
        mvFloaterResetToNotValidated();
        mvFloaterFinishValidateRun();
        return;
      }
      mvFloaterRunValidateWork();
    } catch (e) {
      mvFloaterApplyResult(mvFloaterValidationErrorFromException(e));
    }
    mvFloaterFinishValidateRun();
  }, 10);
}

function mvFloaterCancelIdle() {
  if (!MVFloaterState.idleTimer) return;
  clearTimeout(MVFloaterState.idleTimer);
  MVFloaterState.idleTimer = null;
}

function mvFloaterCanIdleValidate(info) {
  if (!info || !info.ok) return false;
  return info.language === 'html' || info.language === 'xml';
}

function mvFloaterRunIdleValidate() {
  MVFloaterState.idleTimer = null;
  if (!mvFloaterCurrentSettings().validateIdle) return;
  if (!mvFloaterCanIdleValidate(MVCore.getActiveInfo())) return;
  mvFloaterRunValidate('idle');
}

function mvFloaterScheduleIdleValidate() {
  var settings = mvFloaterCurrentSettings();
  if (!settings.validateIdle) {
    mvFloaterCancelIdle();
    return;
  }
  mvFloaterCancelIdle();
  MVFloaterState.idleTimer = setTimeout(mvFloaterRunIdleValidate, settings.debounceMs || 1500);
}
