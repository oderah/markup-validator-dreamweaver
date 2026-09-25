function isDOMRequired() {
  return false;
}

function canAcceptCommand() {
  return true;
}

/**
 * Favorites / Insert Object: opens the Markup Validator floater and runs validation.
 * Does not insert markup into the document.
 */
function objectTag() {
  try {
    dw.setFloaterVisibility('Markup Validator', true);
  } catch (e) { /* ignore */ }
  try {
    MVTrigger.requestValidate();
  } catch (e2) { /* ignore */ }
  return '';
}
