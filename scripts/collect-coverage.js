#!/usr/bin/env node
'use strict';

var path = require('path');
var { spawnSync } = require('child_process');

var root = path.join(__dirname, '..');
var coverageDir = path.join(root, 'coverage');
var coverageFile = path.join(coverageDir, 'coverage-final.json');

var include = [
  'dw-classic/**',
  'scripts/smoke-classic.js',
  'scripts/test-suite.js',
  'scripts/load-classic-scripts.js',
  'scripts/test-helpers.js',
  'scripts/gen-status-icons*.js',
  'scripts/collect-coverage.js',
  'scripts/coverage-sanitize.js'
].join(',');

var c8Bin = path.join(root, 'node_modules', 'c8', 'bin', 'c8.js');
var c8Args = [
  c8Bin,
  '--temp-directory', path.join(coverageDir, '.tmp'),
  '--reports-dir', coverageDir,
  '--reporter', 'json',
  '--include', include,
  '--exclude', '**/node_modules/**',
  '--exclude', '**/dist/**',
  '--exclude', '**/coverage/**',
  '--check-coverage', 'false',
  '--all', 'true',
  process.execPath,
  path.join(__dirname, 'run-coverage-tests.js')
];

var proc = spawnSync(process.execPath, c8Args, {
  cwd: root,
  stdio: 'inherit',
  env: Object.assign({}, process.env, {
    NODE_V8_COVERAGE: path.join(coverageDir, '.tmp')
  })
});

if (proc.status !== 0) {
  process.exit(proc.status === null ? 2 : proc.status);
}

var report = spawnSync(process.execPath, [
  c8Bin,
  'report',
  '--temp-directory', path.join(coverageDir, '.tmp'),
  '--reports-dir', coverageDir,
  '--reporter', 'json'
], { cwd: root, stdio: 'inherit' });

if (report.status !== 0) {
  process.exit(report.status === null ? 2 : report.status);
}

var fs = require('fs');
if (!fs.existsSync(coverageFile)) {
  console.error('collect-coverage: missing ' + coverageFile);
  process.exit(2);
}
var payload = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
if (!payload || !Object.keys(payload).length) {
  console.error('collect-coverage: empty coverage-final.json');
  process.exit(2);
}

require('./coverage-sanitize').sanitizeCoveragePayload(payload);
fs.writeFileSync(coverageFile, JSON.stringify(payload));

console.log('collect-coverage: wrote ' + coverageFile);
