/**
 * Markup Validator floater controller (Dreamweaver classic floating panel).
 */
var MVFloater = {
  onLoad: mvFloaterPanelOnLoad,
  runValidate: mvFloaterRunValidate,
  render: mvFloaterRender,
  selectIssue: mvFloaterSelectIssue,
  onIssueListClick: mvFloaterOnIssueListClick,
  toggleSettings: mvFloaterToggleSettings,
  isResizable: mvFloaterIsResizable,
  getDockingSide: mvFloaterGetDockingSide,
  initialPosition: mvFloaterInitialPosition,
  displayHelp: mvFloaterDisplayHelp,
  documentEdited: mvFloaterOnDocumentEdited,
  selectionChanged: mvFloaterSelectionChanged
};

function isResizable() { return MVFloater.isResizable(); }
function getDockingSide() { return MVFloater.getDockingSide(); }
function initialPosition(w, h) { return MVFloater.initialPosition(w, h); }
function displayHelp() { MVFloater.displayHelp(); }
function documentEdited() { MVFloater.documentEdited(); }
function selectionChanged() { MVFloater.selectionChanged(); }

function mvFloaterOnLoad() { MVFloater.onLoad(); }
function mvRunValidate() { MVFloater.runValidate(); }
function mvToggleSettings() { MVFloater.toggleSettings(); }
function mvRenderIssues() { MVFloater.render(); }
function mvOnIssueListChange() { MVFloater.onIssueListClick(); }
