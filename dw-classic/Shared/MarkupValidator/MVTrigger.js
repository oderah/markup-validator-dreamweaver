/**
 * Markup Validator — request validation via Configuration/Temp flag file.
 */
var MV_TRIGGER_FLAG_SUFFIX = '/Temp/mv-run-validate.txt';

function mvTriggerFlagPath() {
  try {
    return String(dw.getConfigurationPath() + MV_TRIGGER_FLAG_SUFFIX).replace(/\\/g, '/');
  } catch (e) {
    return '';
  }
}

function mvTriggerRequestValidate() {
  var path = mvTriggerFlagPath();
  if (!path || typeof DWfile === 'undefined') return;
  try {
    DWfile.write(path, String((new Date()).getTime()));
  } catch (e2) { /* ignore */ }
}

function mvTriggerConsumeIfPresent() {
  try {
    var path = mvTriggerFlagPath();
    if (!path || typeof DWfile === 'undefined' || !DWfile.exists(path)) return false;
    try { DWfile.remove(path); } catch (e0) { /* ignore */ }
    return true;
  } catch (e) {
    return false;
  }
}

var MVTrigger = {
  flagPath: mvTriggerFlagPath,
  requestValidate: mvTriggerRequestValidate,
  consumeIfPresent: mvTriggerConsumeIfPresent
};
