/**
 * Smoke-test classic JS validators outside Dreamweaver (Node).
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var classicLoad = require('./load-classic-scripts');
var countRule = require('./test-helpers').countRule;

var ctx = classicLoad.createClassicTestContext();
classicLoad.loadValidatorScripts(ctx);
classicLoad.runScript(ctx, 'MVPrefs.js');
classicLoad.runScript(ctx, 'MVTrigger.js');
classicLoad.runScript(ctx, 'MVNavigate.js');
classicLoad.runScript(ctx, 'MVCore.js');
classicLoad.loadFloaterScripts(ctx);

var goodHtml = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'valid.html'), 'utf8');
var badHtml = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'invalid.html'), 'utf8');
var goodXml = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'valid.xml'), 'utf8');
var badXml = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'invalid.xml'), 'utf8');

var r1 = ctx.MVValidateHtml.validate(goodHtml);
var r2 = ctx.MVValidateHtml.validate(badHtml);
var r3 = ctx.MVValidateXml.validate(goodXml);
var r4 = ctx.MVValidateXml.validate(badXml);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(r1.ok, 'valid.html should pass');
assert(!r2.ok && r2.errorCount > 0, 'invalid.html should fail');
assert(r3.ok, 'valid.xml should pass');
assert(!r4.ok && r4.errorCount > 0, 'invalid.xml should fail');

var slashHtml = '<!DOCTYPE html><html lang="en"><head><title>t</title></head>' +
  '<body><br /><hr/><img src="x" alt="y" /></body></html>';
var rSlash = ctx.MVValidateHtml.validate(slashHtml);
assert(rSlash.ok, 'trailing slash on void tags is a warning, not an error');
assert(countRule(rSlash, 'void-slash') === 3, 'warn on <br />, <hr/>, and <img />');

var noSlashHtml = '<!DOCTYPE html><html lang="en"><head><title>t</title></head>' +
  '<body><br><hr><img src="x" alt="y"></body></html>';
var rNoSlash = ctx.MVValidateHtml.validate(noSlashHtml);
assert(rNoSlash.ok && rNoSlash.warningCount === 0, 'void tags without slash should be clean');
assert(countRule(rNoSlash, 'void-slash') === 0, 'no void-slash warnings without trailing slash');

var rSlashOff = ctx.MVValidateHtml.validate(slashHtml, { includeWarnings: false });
assert(countRule(rSlashOff, 'void-slash') === 0, 'void-slash honors includeWarnings: false');

var noDoctype = '<html lang="en"><head><title>t</title></head><body><p>x</p></body></html>';
var rDoctype = ctx.MVValidateHtml.validate(noDoctype);
assert(countRule(rDoctype, 'doctype') === 1, 'missing doctype warns by default');
var rDoctypeOff = ctx.MVValidateHtml.validate(noDoctype, { suppressDoctype: true });
assert(countRule(rDoctypeOff, 'doctype') === 0, 'suppressDoctype hides the missing doctype warning');
assert(rDoctypeOff.warningCount === 0, 'suppressed doctype does not count as a warning');
var badDoctype = '<!DOCTYPE html';
var rBadDoctype = ctx.MVValidateHtml.validate(badDoctype, { suppressDoctype: true });
assert(countRule(rBadDoctype, 'doctype') === 1, 'unterminated doctype stays an error when suppressed');

// Windows Dreamweaver code view counts CRLF as two characters and one line.
var crlf = 'a\r\nb\r\nc';
assert(ctx.MVNavigate.lineColToOffset(crlf, 1, 1) === 0, 'CRLF line 1');
assert(ctx.MVNavigate.lineColToOffset(crlf, 2, 1) === 3, 'CRLF line 2');
assert(ctx.MVNavigate.lineColToOffset(crlf, 3, 1) === 6, 'CRLF line 3');
assert(ctx.MVNavigate.lineColToOffset('a\nb\nc', 3, 1) === 4, 'LF line 3');

var floaterHash = ctx.MVFloaterLib.hashText('<p>x</p>');
assert(typeof floaterHash === 'string' && floaterHash.length > 0, 'floater hash helper');
assert(ctx.MVFloaterLib.issuePassesFilters({ severity: 'error' }, true, true, false), 'floater filter');
var coreInfo = ctx.MVCore.validateText(goodHtml, 'html', { includeWarnings: true });
assert(coreInfo.ok, 'MVCore.validateText on good html');
assert(ctx.MVCore.getActiveInfo().error, 'getActiveInfo without dw document');

assert(ctx.mvNavTokenLength('<br/>', 0) >= 1, 'nav token length from snippet');
assert(ctx.mvNavTokenLength('x', 4) === 4, 'nav token length explicit');

ctx.dw.getDocumentDOM = function () {
  return { URL: 'file:///C|/tmp/a.html', setView: function () {}, getView: function () { return 'code'; } };
};
ctx.dw.openDocument = function () {};
ctx.DWfile.exists = function () { return true; };
ctx.mvNavOpenIssueFile({ file: 'file:///C|/tmp/a.html' });

var label = ctx.MVFloaterLib.issueOptionLabel({ severity: 'warning', line: 1, message: 'm', file: '/a/b.html' });
assert(label.indexOf('[Warn]') >= 0 && label.indexOf('m') >= 0, 'floater issue label keeps the warning message');
var accurateLabel = ctx.MVFloaterLib.issueOptionLabel({
  severity: 'error',
  line: 40,
  column: 8,
  message: 'Unclosed element <div>.',
  file: '/docs/page.html'
});
assert(accurateLabel.indexOf('Unclosed element <div>.') >= 0, 'list label keeps the error message');
var longLabel = ctx.MVFloaterLib.issueOptionLabel({
  severity: 'error',
  line: 1,
  message: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'
});
assert(longLabel.length <= 48, 'list labels stay short so the select cannot widen the floater');
assert(longLabel.indexOf('[Error] abcdefghijklmnopqrstuvwxyz') === 0, 'truncated label keeps the start of the message');
assert(ctx.MVFloaterLib.missingDoctypeWarning({ severity: 'warning', ruleId: 'doctype' }), 'doctype warning detect');

ctx.Option = function (label, value) {
  return { text: label, value: value };
};
var floaterDom = {};
function dwOptionCollection() {
  var items = [];
  return new Proxy(items, {
    set: function (target, prop, value) {
      if (String(prop) === '0' && value == null) {
        target.shift();
        return true;
      }
      target[prop] = value;
      return true;
    }
  });
}
var issueListEl = { options: dwOptionCollection(), selectedIndex: -1 };
ctx.document.getElementById = function (id) {
  if (id === 'issueList') return issueListEl;
  if (!floaterDom[id]) {
    floaterDom[id] = { innerHTML: '', className: '', src: '', checked: true };
  }
  return floaterDom[id];
};
ctx.MVFloaterState.uiState = 'ok';
ctx.mvFloaterApplyResult({
  ok: true,
  issues: [{ severity: 'error', line: 1, message: 'e' }],
  errorCount: 1,
  warningCount: 0
});
assert(floaterDom.summary && floaterDom.summary.innerHTML.indexOf('errors') >= 0, 'floater summary render');
ctx.mvFloaterApplyResult({ error: 'No active document.' });
ctx.mvFloaterApplyResult({ ok: true, issues: [], errorCount: 0, warningCount: 1 });
var issueList = ctx.document.getElementById('issueList');
issueList.selectedIndex = 0;
issueList.options[0] = ctx.Option('0', '0');
ctx.mvFloaterOnIssueListClickDeferred();

var longA = 'First issue description that must appear in full, not truncated in the list. ' +
  'Extra detail about the first error stays visible in the detail section.';
var longB = 'Second issue description replaces the first when that row is clicked. ' +
  'The detail section shows this message in full.';
ctx.mvFloaterApplyResult({
  ok: false,
  issues: [
    { severity: 'error', line: 4, column: 2, message: longA, ruleId: 'mismatch', file: '/docs/a.html' },
    { severity: 'warning', line: 9, column: 1, message: longB, ruleId: 'unclosed' }
  ],
  errorCount: 1,
  warningCount: 1
});
assert(floaterDom.issueDetail && floaterDom.issueDetail.innerHTML.indexOf(longA) >= 0, 'detail shows the first error in full before a click');
issueList.selectedIndex = 0;
issueList.options[0] = ctx.Option('0', '0');
issueList.options[1] = ctx.Option('1', '1');
ctx.mvFloaterOnIssueListClickDeferred();
assert(floaterDom.issueDetail.innerHTML.indexOf(longA) >= 0, 'detail shows the selected error in full');
assert(floaterDom.issueDetail.innerHTML.indexOf('Line 4') >= 0, 'detail includes the selected location');
issueList.selectedIndex = 1;
ctx.mvFloaterOnIssueListClickDeferred();
assert(floaterDom.issueDetail.innerHTML.indexOf(longB) >= 0, 'detail updates when another issue is clicked');
assert(floaterDom.issueDetail.innerHTML.indexOf(longA) < 0, 'detail drops the previous issue');

var divList = { innerHTML: '' };
ctx.MVFloaterLib.fillIssueList(divList, [
  { severity: 'error', line: 2, column: 3, message: 'Full <message> that wraps inside the panel' }
], 0);
assert(divList.innerHTML.indexOf('mvFloaterSelectIssue(0)') >= 0, 'issue row selects on click');
assert(divList.innerHTML.indexOf('&lt;message&gt;') >= 0, 'issue row escapes the message');
assert(divList.innerHTML.indexOf('issue-row-selected') >= 0, 'selected issue row is marked');
assert(ctx.MVFloaterLib.displayHtml('C:/a/b.html').indexOf('<wbr>') >= 0, 'paths can wrap at slashes');
assert(ctx.MVFloaterLib.displayHtml('abcdefghijklmnopqrstuvwxyz').indexOf('<wbr>') >= 0, 'long labels break so they cannot widen the floater');

var navDom = {
  setView: function () {},
  getView: function () { return 'design'; },
  setSelection: function () {},
  source: {
    getText: function () { return 'ab\ncd'; },
    getOffsetFromLine: function (ln) { return ln === 1 ? 0 : 3; },
    setCurrentLine: function () {},
    synchronizeDocument: function () {}
  }
};
ctx.dw.getDocumentDOM = function () { return navDom; };
assert(ctx.mvNavGoToIssue({ line: 2, column: 1, length: 2 }), 'nav goToIssue');
assert(ctx.mvNavReadSourceBuffer({ source: { getText: function () { throw new Error('x'); } } }) === '', 'nav buffer read error');
ctx.mvFloaterUpdateDirtyState(true, 'mtime', 'disk', 'hash');
ctx.DWfile.write = function () {};
ctx.DWfile.remove = function () {};
ctx.DWfile.exists = function () { return true; };
ctx.MVTrigger.requestValidate();
assert(ctx.MVTrigger.consumeIfPresent(), 'trigger flag consume');

ctx.dw.getDocumentDOM = function () {
  return {
    URL: 'file:///doc',
    setView: function () {},
    getView: function () { return 'design'; },
    getIsDirty: function () { return false; }
  };
};
ctx.mvFloaterPollDocument();

console.log('classic smoke OK');
console.log('  valid.html', r1.errorCount, 'errors');
console.log('  invalid.html', r2.errorCount, 'errors');
console.log('  valid.xml', r3.errorCount, 'errors');
console.log('  invalid.xml', r4.errorCount, 'errors');
