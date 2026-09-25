'use strict';

require('./coverage-sanitize').sanitizeCoveragePayload({
  './probe.js': { statementMap: { '0': { start: { line: 1, column: -1 } } } }
});
require('./smoke-classic.js');
require('./test-suite.js');
