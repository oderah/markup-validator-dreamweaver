function isDOMRequired() {
  return false;
}

function canAcceptCommand() {
  return true;
}

function commandButtons() {
  return new Array('Save', 'saveSettings()', 'Cancel', 'window.close()');
}

function onLoadSettings() {
  MVPrefs.applySettingsToForm(document.theForm, MVPrefs.load());
}

function saveSettings() {
  MVPrefs.save(MVPrefs.readSettingsFromForm(document.theForm));
  try { MVTrigger.requestValidate(); } catch (e) { /* ignore */ }
  window.close();
}
