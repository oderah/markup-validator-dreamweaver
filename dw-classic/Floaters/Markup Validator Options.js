/**
 * Markup Validator Options — separate floater (DW can show/hide this; it cannot hide table rows).
 */
function isResizable() { return true; }
function getDockingSide() { return 'left right'; }
function initialPosition(w, h) {
  return 'left 280 ' + Math.min(h, 290);
}

function displayHelp() {
  alert('Idle, save, and warning options for Markup Validator.');
}

function prefsForm() {
  try { if (document.theForm) return document.theForm; } catch (e1) { /* ignore */ }
  try { if (document.forms && document.forms['theForm']) return document.forms['theForm']; } catch (e2) { /* ignore */ }
  return null;
}

var mvOptionsApplying = false;

function mvOptionsOnLoad() {
  var f = prefsForm();
  if (!f) return;
  mvOptionsApplying = true;
  try {
    MVPrefs.applySettingsToForm(f, MVPrefs.load());
  } finally {
    mvOptionsApplying = false;
  }
}

var BOOL_DEFAULTS = {
  validateIdle: true,
  validateSave: true,
  includeWarnings: true,
  warningsFail: false,
  suppressDoctype: false
};

function mvOptionsAssignChecked(box, on) {
  if (box) box.checked = !!on;
}

function setChecked(name, on) {
  var form = prefsForm();
  var box = form && form[name];
  mvOptionsApplying = true;
  try {
    mvOptionsAssignChecked(box, on);
    if (document.getElementById) mvOptionsAssignChecked(document.getElementById(name), on);
  } finally {
    mvOptionsApplying = false;
  }
}

function requestRevalidate() {
  try { MVTrigger.requestValidate(); } catch (e) { /* ignore */ }
}

// Click runs before the layout engine updates checkbox.checked, and the label
// can deliver a second click. Flip the stored preference and then match the box to it.
var lastFlip = {};
function mvToggleSetting(name) {
  if (mvOptionsApplying) return;
  var now = new Date().getTime();
  if (lastFlip[name] && now - lastFlip[name] < 300) return;
  lastFlip[name] = now;
  var next = !BOOL_DEFAULTS[name];
  try { next = !MVPrefs.getBool(name, !!BOOL_DEFAULTS[name]); } catch (e) { /* ignore */ }
  try { MVPrefs.setBool(name, next); } catch (e2) { /* ignore */ }
  setTimeout(function () { setChecked(name, next); }, 0);
  requestRevalidate();
}

var saveTimer = null;
function mvOptionsSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(mvOptionsSaveNow, 50);
}

function mvOptionsSaveNow() {
  saveTimer = null;
  var f = prefsForm();
  if (!f) return;
  var s = MVPrefs.load();
  s.debounceMs = parseInt(f.debounceMs.value, 10) || 1500;
  MVPrefs.save(s);
  requestRevalidate();
}

function mvOptionsDone() {
  mvOptionsSave();
  try { dw.setFloaterVisibility('Markup Validator Options', false); } catch (e) { /* ignore */ }
}
