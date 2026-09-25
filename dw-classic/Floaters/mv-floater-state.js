/**
 * Shared state for the Markup Validator classic floater.
 */
var MVFloaterState = {
  lastResult: null,
  selectedIndex: -1,
  idleTimer: null,
  lastDirty: false,
  lastSourceHash: '',
  busy: false,
  pendingSave: false,
  lastUrl: null,
  lastMtime: null,
  hadUnsaved: false,
  suppressListEvent: false,
  uiState: 'none',
  startedUrl: '',
  startedHash: '',
  lastSuppressDoctype: false
};

var MVFloaterStateLabels = {
  none: 'Not validated',
  busy: 'Validating…',
  ok: 'No error',
  fail: 'Error'
};
