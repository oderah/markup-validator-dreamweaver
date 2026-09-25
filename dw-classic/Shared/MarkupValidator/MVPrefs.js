/**
 * Markup Validator — preference helpers (Dreamweaver classic JS).
 * Pref keys stored via dreamweaver.get/setPreferenceString.
 */
var MVPrefs = (function () {
  var PREFIX = 'MarkupValidator_';

  function get(key, fallback) {
    try {
      var v = dreamweaver.getPreferenceString(PREFIX + key);
      if (v == null || v === '') return fallback;
      return v;
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      dreamweaver.setPreferenceString(PREFIX + key, String(value));
    } catch (e) { /* ignore */ }
  }

  function getBool(key, fallback) {
    var v = get(key, fallback ? '1' : '0');
    return v === '1' || v === 'true' || v === 'yes';
  }

  function setBool(key, value) {
    set(key, value ? '1' : '0');
  }

  function getInt(key, fallback) {
    var n = parseInt(get(key, String(fallback)), 10);
    return isNaN(n) ? fallback : n;
  }

  function load() {
    return {
      debounceMs: getInt('debounceMs', 1500),
      validateIdle: getBool('validateIdle', true),
      validateSave: getBool('validateSave', true),
      includeWarnings: getBool('includeWarnings', true),
      warningsFail: getBool('warningsFail', false),
      suppressDoctype: getBool('suppressDoctype', false)
    };
  }

  function save(settings) {
    if (!settings) return;
    set('debounceMs', settings.debounceMs || 1500);
    setBool('validateIdle', !!settings.validateIdle);
    setBool('validateSave', !!settings.validateSave);
    setBool('includeWarnings', !!settings.includeWarnings);
    setBool('warningsFail', !!settings.warningsFail);
    setBool('suppressDoctype', !!settings.suppressDoctype);
  }

  function applySettingsToForm(form, settings) {
    if (!form || !settings) return;
    form.debounceMs.value = String(settings.debounceMs || 1500);
    form.validateIdle.checked = !!settings.validateIdle;
    form.validateSave.checked = !!settings.validateSave;
    form.includeWarnings.checked = !!settings.includeWarnings;
    form.warningsFail.checked = !!settings.warningsFail;
    form.suppressDoctype.checked = !!settings.suppressDoctype;
  }

  function readSettingsFromForm(form) {
    if (!form) return load();
    return {
      debounceMs: parseInt(form.debounceMs.value, 10) || 1500,
      validateIdle: !!form.validateIdle.checked,
      validateSave: !!form.validateSave.checked,
      includeWarnings: !!form.includeWarnings.checked,
      warningsFail: !!form.warningsFail.checked,
      suppressDoctype: !!form.suppressDoctype.checked
    };
  }

  return {
    get: get,
    set: set,
    getBool: getBool,
    setBool: setBool,
    getInt: getInt,
    load: load,
    save: save,
    applySettingsToForm: applySettingsToForm,
    readSettingsFromForm: readSettingsFromForm
  };
})();
