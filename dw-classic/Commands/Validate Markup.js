function isDOMRequired() {
  return true;
}

function canAcceptCommand() {
  return true;
}

function commandButtons() {
  return new Array('Validate', 'doValidate()', 'Close', 'window.close()');
}

function onLoad() {}

function doValidate() {
  try {
    MVCore.showFloater();
  } catch (e) { /* ignore */ }
  try {
    MVTrigger.requestValidate();
  } catch (e2) { /* ignore */ }
  try { window.close(); } catch (e3) { /* ignore */ }
}

function receiveArguments() {
  doValidate();
}
