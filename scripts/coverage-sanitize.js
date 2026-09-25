'use strict';

function processCoverageValue(val) {
  if (!val || typeof val !== 'object') return;
  if (Array.isArray(val)) {
    var i;
    for (i = 0; i < val.length; i++) processCoverageValue(val[i]);
    return;
  }
  if (val.column === -1) val.column = 0;
  var keys = Object.keys(val);
  for (i = 0; i < keys.length; i++) processCoverageValue(val[keys[i]]);
}

function sanitizeCoveragePayload(payload) {
  var keys = Object.keys(payload || {});
  var i;
  for (i = 0; i < keys.length; i++) processCoverageValue(payload[keys[i]]);
  return payload;
}

module.exports = { sanitizeCoveragePayload: sanitizeCoveragePayload };
