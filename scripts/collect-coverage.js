#!/usr/bin/env node
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var { spawnSync } = require('child_process');

var root = path.join(__dirname, '..');
var coverageDir = path.join(root, 'coverage');
var coverageFile = path.join(coverageDir, 'coverage-final.json');
var c8Bin = path.join(root, 'node_modules', 'c8', 'bin', 'c8.js');

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

function coverageEnv() {
  var env = Object.assign({}, process.env);
  // c8 sets this for the test child. A shared value makes two gate runs
  // write the same V8 dumps and the same coverage-final.json.
  delete env.NODE_V8_COVERAGE;
  return env;
}

function runNode(args, env) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    env: env
  });
}

function statusOf(proc) {
  if (proc.status === 0) return 0;
  if (proc.status === null) return 2;
  return proc.status;
}

function readProduced(reportsDir) {
  var produced = path.join(reportsDir, 'coverage-final.json');
  var payload = JSON.parse(fs.readFileSync(produced, 'utf8'));
  if (!payload) return null;
  if (!Object.keys(payload).length) return null;
  return payload;
}

function publishCoverage(payload) {
  fs.mkdirSync(coverageDir, { recursive: true });
  var tmpOut = path.join(coverageDir, '.coverage-final.' + process.pid + '.json');
  fs.writeFileSync(tmpOut, JSON.stringify(payload));
  fs.renameSync(tmpOut, coverageFile);
}

function collect() {
  var runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-coverage-'));
  var tempDir = path.join(runDir, 'tmp');
  var reportsDir = path.join(runDir, 'report');
  fs.mkdirSync(tempDir);
  fs.mkdirSync(reportsDir);
  var env = coverageEnv();
  try {
    var proc = runNode([
      c8Bin,
      '--temp-directory', tempDir,
      '--reports-dir', reportsDir,
      '--reporter', 'json',
      '--include', include,
      '--exclude', '**/node_modules/**',
      '--exclude', '**/dist/**',
      '--exclude', '**/coverage/**',
      '--check-coverage', 'false',
      '--all', 'true',
      process.execPath,
      path.join(__dirname, 'run-coverage-tests.js')
    ], env);
    var testStatus = statusOf(proc);
    if (testStatus !== 0) return testStatus;

    var report = runNode([
      c8Bin,
      'report',
      '--temp-directory', tempDir,
      '--reports-dir', reportsDir,
      '--reporter', 'json'
    ], env);
    var reportStatus = statusOf(report);
    if (reportStatus !== 0) return reportStatus;

    var payload = readProduced(reportsDir);
    if (!payload) {
      console.error('collect-coverage: empty coverage-final.json');
      return 2;
    }
    require('./coverage-sanitize').sanitizeCoveragePayload(payload);
    publishCoverage(payload);
    console.log('collect-coverage: wrote ' + coverageFile);
    return 0;
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }
}

process.exit(collect());
