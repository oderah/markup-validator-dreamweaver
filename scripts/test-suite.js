/**
 * Extensive checks for the classic validators, preferences, and options floater.
 * No Dreamweaver process required.
 * Run: node scripts/test-suite.js
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');
var assert = require('assert');

var root = path.join(__dirname, '..');
var shared = path.join(root, 'dw-classic', 'Shared', 'MarkupValidator');
var failures = 0;
var passed = 0;

function check(cond, msg) {
  if (cond) {
    passed++;
    return;
  }
  failures++;
  console.error('FAIL: ' + msg);
}

function finishSuite() {
  if (failures) {
    console.error(passed + ' passed, ' + failures + ' failed');
    process.exit(1);
  }
  console.log('test-suite: ' + passed + ' passed');
}

var countRule = require('./test-helpers').countRule;
var classicLoad = require('./load-classic-scripts');

function loadClassic() {
  var ctx = classicLoad.createClassicTestContext();
  classicLoad.loadClassicTestHarness(ctx);
  return ctx;
}

var ctx = loadClassic();
var html = ctx.MVValidateHtml;
var xml = ctx.MVValidateXml;
var core = ctx.MVCore;
var prefs = ctx.MVPrefs;

var page = '<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><p>Hi</p></body></html>';

check(html.validate(page).ok && html.validate(page).warningCount === 0, 'well-formed HTML page is clean');
check(html.validate('<!doctype html>' + page.slice(page.indexOf('<html'))).warningCount === 0, 'lowercase doctype counts');
check(html.validate('\uFEFF' + page).ok, 'BOM before a real doctype is clean');

var noDoc = '<html><head><title>t</title></head><body><p>x</p></body></html>';
var missing = html.validate(noDoc);
check(countRule(missing, 'doctype') === 1 && missing.warningCount === 1 && missing.ok, 'missing doctype is a warning');
var suppressed = html.validate(noDoc, { suppressDoctype: true });
check(countRule(suppressed, 'doctype') === 0 && suppressed.warningCount === 0, 'validator drops missing doctype when asked');

var openDoc = '<!DOCTYPE html';
var openKept = html.validate(openDoc, { suppressDoctype: true });
check(countRule(openKept, 'doctype') === 1 && !openKept.ok, 'unterminated doctype stays an error');

var empty = html.validate('   \n  ');
check(!empty.ok && empty.issues[0].ruleId === 'empty', 'blank HTML is an error');

var dups = html.validate('<!DOCTYPE html><html><body><div id="a"></div><span id="a"></span></body></html>');
check(countRule(dups, 'dup-id') === 1 && !dups.ok, 'duplicate id is an error');

var img = html.validate('<!DOCTYPE html><html><body><img src="a.png"></body></html>');
check(countRule(img, 'img-alt') === 1 && img.ok, 'img without alt is a warning');
check(countRule(html.validate('<!DOCTYPE html><html><body><img src="a.png" alt=""></body></html>'), 'img-alt') === 0, 'empty alt satisfies the check');

var anchor = html.validate('<!DOCTYPE html><html><body><a>text</a></body></html>');
check(countRule(anchor, 'a-href') === 1, 'anchor without href is a warning');

var unclosed = html.validate('<!DOCTYPE html><html><body><div><p>x</div></body></html>');
check(countRule(unclosed, 'unclosed') >= 1 && !unclosed.ok, 'unclosed element is an error');

var extra = html.validate('<!DOCTYPE html><html><body></div></body></html>');
check(countRule(extra, 'mismatch') === 1, 'unexpected close is an error');

var comment = html.validate('<!DOCTYPE html><html><body><!-- oops</body></html>');
check(countRule(comment, 'comment') === 1 && !comment.ok, 'unterminated comment is an error');

var slashes = '<!DOCTYPE html><html><head><title>t</title></head><body><br /><hr/><img src="x" alt="y" /></body></html>';
check(countRule(html.validate(slashes), 'void-slash') === 3, 'three void trailing slashes');
check(countRule(html.validate(slashes, { includeWarnings: false }), 'void-slash') === 0, 'warnings off hides void slashes');
check(countRule(html.validate(noDoc, { includeWarnings: false }), 'doctype') === 0, 'warnings off hides missing doctype');

var goodXml = '<?xml version="1.0"?><root><item>a</item></root>';
check(xml.validate(goodXml).ok, 'well-formed XML passes');
check(!xml.validate('   ').ok, 'blank XML fails');
check(!xml.validate('<root><item></root>').ok, 'mismatched XML fails');
check(!xml.validate('<root>').ok, 'unclosed XML fails');
check(!xml.validate('<root><!--</root>').ok, 'unterminated XML comment fails');
check(xml.validate('<root><![CDATA[ <not> a tag ]]></root>').ok, 'CDATA is not parsed as markup');

var defaults = prefs.load();
check(defaults.validateIdle === true, 'idle defaults on');
check(defaults.validateSave === true, 'save defaults on');
check(defaults.includeWarnings === true, 'warnings default on');
check(defaults.warningsFail === false, 'warnings-fail defaults off');
check(defaults.suppressDoctype === false, 'suppress doctype defaults off');
check(defaults.debounceMs === 1500, 'debounce defaults to 1500');

prefs.setBool('suppressDoctype', true);
prefs.setBool('warningsFail', false);
check(prefs.getBool('suppressDoctype', false) === true, 'stored "1" reads as true');
prefs.setBool('suppressDoctype', false);
check(prefs.getBool('suppressDoctype', true) === false, 'stored "0" reads as false, ignoring the fallback');
prefs.set('debounceMs', '2000');
check(prefs.load().debounceMs === 2000, 'debounce round-trips');

var coreMissing = core.validateText(noDoc, 'html', prefs.load());
check(countRule(coreMissing, 'doctype') === 1, 'core reports missing doctype by default');
prefs.setBool('suppressDoctype', true);
var coreOff = core.validateText(noDoc, 'html', prefs.load());
check(countRule(coreOff, 'doctype') === 0 && coreOff.warningCount === 0 && coreOff.ok, 'core strips missing doctype and recounts');
var coreError = core.validateText(openDoc, 'html', prefs.load());
check(!coreError.ok && countRule(coreError, 'doctype') === 1, 'core keeps unterminated doctype');

prefs.setBool('suppressDoctype', false);
prefs.setBool('includeWarnings', false);
var noWarn = core.validateText(slashes, 'html', prefs.load());
check(noWarn.warningCount === 0 && countRule(noWarn, 'void-slash') === 0, 'core drops every warning when includeWarnings is off');
check(core.validateText('<!DOCTYPE html><html><body><div></body></html>', 'html', prefs.load()).errorCount > 0, 'errors remain when warnings are off');

prefs.setBool('includeWarnings', true);
prefs.setBool('warningsFail', true);
var failWarn = core.validateText(noDoc, 'html', prefs.load());
check(failWarn.ok === false && failWarn.warningCount > 0, 'warningsFail marks a warnings-only result as not ok');
prefs.setBool('warningsFail', false);
check(core.validateText(goodXml, 'xml', prefs.load()).ok, 'XML goes through core');

prefs.setBool('suppressDoctype', false);
ctx.mvToggleSetting('suppressDoctype');
check(prefs.getBool('suppressDoctype', false) === true, 'toggle stores suppress without reading the checkbox');
ctx.mvToggleSetting('suppressDoctype');
check(prefs.getBool('suppressDoctype', false) === true, 'a second click in the same turn does not flip the preference back');

prefs.setBool('validateIdle', true);
ctx._prefs.MarkupValidator_validateIdle = '1';
ctx.lastFlip.validateIdle = 0;
ctx.mvToggleSetting('validateIdle');
check(prefs.getBool('validateIdle', true) === false, 'toggle turns idle off from the stored value');
ctx.lastFlip.warningsFail = 0;
prefs.setBool('warningsFail', false);
ctx.mvToggleSetting('warningsFail');
check(prefs.getBool('warningsFail', false) === true, 'toggle turns warnings-fail on');

prefs.setBool('suppressDoctype', true);
ctx.document.theForm.suppressDoctype.checked = false;
ctx.document.theForm.validateIdle.checked = false;
ctx.document.theForm.debounceMs.value = '1000';
ctx.mvOptionsSaveNow();
var afterMenu = prefs.load();
check(afterMenu.debounceMs === 1000, 'debounce menu is saved');
check(afterMenu.suppressDoctype === true, 'debounce save does not clear suppress doctype from a stale checkbox');
check(afterMenu.validateIdle === false, 'debounce save keeps the idle value already stored');

ctx.document.theForm.includeWarnings.checked = false;
ctx.document.theForm.warningsFail.checked = true;
ctx.document.theForm.suppressDoctype.checked = true;
ctx.document.theForm.validateIdle.checked = false;
ctx.document.theForm.validateSave.checked = false;
ctx.document.theForm.debounceMs.value = '2000';
ctx.saveSettings();
var fromCommand = prefs.load();
check(fromCommand.includeWarnings === false, 'settings command saves include-warnings from the form');
check(fromCommand.warningsFail === true, 'settings command saves warnings-fail');
check(fromCommand.suppressDoctype === true, 'settings command saves suppress doctype');
check(fromCommand.validateSave === false, 'settings command saves validate-on-save');
check(fromCommand.debounceMs === 2000, 'settings command saves debounce');

var iconGlyphs = require(path.join(root, 'scripts', 'gen-status-icons-glyphs'));
var iconRender = require(path.join(root, 'scripts', 'gen-status-icons-render'));
check(iconGlyphs.genIconInGlyph('dots', 8, 8), 'status icon dots glyph samples');
check(iconRender.genIconRenderIcon({ color: [0, 0, 0], glyph: 'dots' }, 16, 4).length === 16 * 16 * 4, 'status icon render');
var iconGif = require(path.join(root, 'scripts', 'gen-status-icons-gif'));
var toolGif = fs.readFileSync(path.join(root, 'dw-classic', 'Objects', 'Favorites', 'Markup Validator.gif'));
check(toolGif.slice(0, 6).toString('ascii') === 'GIF89a', 'insert-bar tool icon is a GIF');
check(toolGif[6] === 18 && toolGif[8] === 18, 'insert-bar tool icon is 18x18');
check(iconGif.genIconEncodeGif(Buffer.alloc(4, 255), 1)[0] === 0x47, 'gif encoder writes a GIF header');

finishSuite();
