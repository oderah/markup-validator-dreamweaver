'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var SHARED = path.join(__dirname, '..', 'dw-classic', 'Shared', 'MarkupValidator');

var VALIDATOR_SCRIPTS = [
  'MVSharedText.js',
  'MVValidateHtmlCommon.js',
  'MVValidateHtmlAttrs.js',
  'MVValidateHtmlSkip.js',
  'MVValidateHtmlStack.js',
  'MVValidateHtmlScan.js',
  'MVValidateHtml.js',
  'MVValidateXmlCommon.js',
  'MVValidateXmlSkip.js',
  'MVValidateXmlTags.js',
  'MVValidateXmlScan.js',
  'MVValidateXml.js'
];

function runScript(ctx, name) {
  var fullPath = path.join(SHARED, name);
  vm.runInContext(fs.readFileSync(fullPath, 'utf8'), ctx, { filename: fullPath });
}

function loadValidatorScripts(ctx) {
  VALIDATOR_SCRIPTS.forEach(function (name) {
    runScript(ctx, name);
  });
}

function createClassicTestContext() {
  var prefs = {};
  var ctx = {
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Date: Date,
    dreamweaver: {
      getPreferenceString: function (section, key, defaultValue) {
        if (arguments.length < 2) throw new Error('getPreferenceString(section, key, defaultValue)');
        var bucket = prefs[section];
        if (!bucket || !Object.prototype.hasOwnProperty.call(bucket, key)) {
          return defaultValue == null ? '' : String(defaultValue);
        }
        return bucket[key];
      },
      setPreferenceString: function (section, key, value) {
        if (arguments.length < 3) throw new Error('setPreferenceString(section, key, value)');
        if (!prefs[section]) prefs[section] = {};
        prefs[section][key] = String(value);
      }
    },
    dw: {
      getConfigurationPath: function () { return '/tmp'; },
      setFloaterVisibility: function () {},
      getDocumentDOM: function () { return null; }
    },
    DWfile: {
      write: function () {},
      exists: function () { return false; },
      remove: function () {}
    },
    MVTrigger: undefined,
    document: {},
    window: { close: function () {} }
  };
  ctx.document.theForm = {
    debounceMs: { value: '1500' },
    validateIdle: { checked: true },
    validateSave: { checked: true },
    includeWarnings: { checked: true },
    warningsFail: { checked: false },
    suppressDoctype: { checked: false }
  };
  ctx.document.forms = { theForm: ctx.document.theForm };
  ctx.document.getElementById = function () { return null; };
  vm.createContext(ctx);
  ctx._prefs = prefs;
  return ctx;
}

var FLOATER_UI_SCRIPTS = [
  'mv-floater-state.js',
  'mv-floater-ui.js',
  'mv-floater-render.js',
  'mv-floater-validate.js',
  'mv-floater-document.js'
];

function loadFloaterScripts(ctx) {
  runScript(ctx, 'MVFloaterLib.js');
  var floaters = path.join(__dirname, '..', 'dw-classic', 'Floaters');
  FLOATER_UI_SCRIPTS.forEach(function (name) {
    var fullPath = path.join(floaters, name);
    vm.runInContext(fs.readFileSync(fullPath, 'utf8'), ctx, { filename: fullPath });
  });
  var mainFloater = path.join(floaters, 'Markup Validator.js');
  vm.runInContext(fs.readFileSync(mainFloater, 'utf8'), ctx, { filename: mainFloater });
}

function loadClassicTestHarness(ctx) {
  ['MVPrefs.js', 'MVTrigger.js'].forEach(function (name) {
    runScript(ctx, name);
  });
  loadValidatorScripts(ctx);
  ['MVNavigate.js', 'MVCore.js'].forEach(function (name) {
    runScript(ctx, name);
  });
  loadFloaterScripts(ctx);
  var root = path.join(__dirname, '..');
  vm.runInContext(
    fs.readFileSync(path.join(root, 'dw-classic', 'Floaters', 'Markup Validator Options.js'), 'utf8'),
    ctx,
    { filename: path.join(root, 'dw-classic', 'Floaters', 'Markup Validator Options.js') }
  );
  vm.runInContext(
    fs.readFileSync(path.join(root, 'dw-classic', 'Commands', 'Markup Validator Settings.js'), 'utf8'),
    ctx,
    { filename: path.join(root, 'dw-classic', 'Commands', 'Markup Validator Settings.js') }
  );
}

module.exports = {
  runScript: runScript,
  loadValidatorScripts: loadValidatorScripts,
  loadFloaterScripts: loadFloaterScripts,
  createClassicTestContext: createClassicTestContext,
  loadClassicTestHarness: loadClassicTestHarness
};
