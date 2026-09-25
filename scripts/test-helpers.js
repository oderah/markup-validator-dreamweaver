'use strict';

function countRule(result, ruleId) {
  var n = 0;
  var i;
  for (i = 0; i < result.issues.length; i++) {
    if (result.issues[i].ruleId === ruleId) n++;
  }
  return n;
}

module.exports = { countRule: countRule };
