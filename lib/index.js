const { program } = require("commander");
const { default: Benchmark } = require("buffalo-bench");
const fastGlob = require("fast-glob");
const path = require("path");

const { version, description } = require("../package.json");

program
  .version(version, "-v, --version", "Output the version number")
  .name("bench-test")
  .description(description)
  .arguments("[dirs...]")
  .helpOption("-h, --help", "Display help for command");

program.option("-r, --reporter <spec>", "Reporter to use", "spec");
const reporters = require("./reporters");

program.option("-R, --repository <repository>", "Repository to use", "file");
const repositories = require("./repositories");

program.option("--require [files...]", "Require files before tests");

program.option("--max-time <seconds>", "The maximum time a benchmark is allowed to run before finishing (secs)");
program.option("--min-samples <seconds>", "The minimum sample size required to perform statistical analysis");

let availableReporters = Object.keys(reporters)
  .map((key) => ` - ${key}`)
  .join("\n");

let availableRepositories = Object.keys(repositories)
  .map((key) => ` - ${key}`)
  .join("\n");

program.on("--help", () => {
  console.log(`
Available reporters:
${availableReporters}

Available repositories:
${availableRepositories}
`);
});

let compare;
let suite;
let benchmark;
let before;
let after;
let beforeEach;
let afterEach;

const suites = [];
const skip = [];
const only = [];
let nextSuiteIndex = 0;

const repository = new repositories[program.repository]();
const reporter = new reporters[program.reporter](repository);

async function runNext() {
  let currentSuite = suites[nextSuiteIndex];
  nextSuiteIndex += 1;

  if (!currentSuite) {
    await reporter.onComplete(suites);
    if (reporter.errorCount) {
      process.exit(1);
    }

    process.exit(0);
  }

  if ((only.length && only.indexOf(currentSuite.name) === -1) || (skip.length && skip.indexOf(currentSuite.name) > -1) || currentSuite.length === 0) {
    return runNext();
  }

  await currentSuite.run();
  runNext();
}

function addSuite({ name, fn, isComparison }) {
  let suite;
  let beforeCallbacks = new Set();
  let afterCallbacks = new Set();
  let beforeEachCallbacks = new Set();
  let afterEachCallbacks = new Set();

  before = (callback) => beforeCallbacks.add(callback);
  after = (callback) => afterCallbacks.add(callback);
  beforeEach = (callback) => beforeEachCallbacks.add(callback);
  afterEach = (callback) => afterEachCallbacks.add(callback);

  suite = new Benchmark.Suite(name, {
    before: async () => reporter.onStartSuite({ suite, beforeCallbacks }),
    after: async () => reporter.onCompleteSuite({ suite, afterCallbacks }),
    beforeEach: async (benchmark) => reporter.onStartBenchmark({ suite, benchmark, beforeEachCallbacks }),
    afterEach: async (benchmark) => reporter.onCompleteBenchmark({ suite, benchmark, afterEachCallbacks }),
    onError(e) {
      console.log(e);
    },
    maxTime: program.maxTime || 5,
    minSamples: program.minSamples || 1
  });
  suite.isComparison = isComparison;

  benchmark = (name, bench) => suite.add(name, bench);
  fn();

  suites.push(suite);
}

suite = (name, fn) => addSuite({ name, fn, isComparison: false });
suite.only = (name, fn) => only.push(name) && suite(name, fn);
suite.skip = (name, fn) => skip.push(name) && suite(name, fn);

compare = (name, fn) => addSuite({ name, fn, isComparison: true });
compare.only = (name, fn) => only.push(name) && compare(name, fn);
compare.skip = (name, fn) => skip.push(name) && compare(name, fn);

async function run() {
  if (program.require) {
    for (let file of program.require) {
      if (file.startsWith(".")) {
        require(path.join(process.cwd(), file));
      } else {
        require(file);
      }
    }
  }

  let dirs = (program.args.length ? program.args : ["bench"])
    .filter((dir) => dir.indexOf("*") !== -1 || /\.(js|mjs|jsx|ts|tsx)$/.test(dir) === false)
    .map((dir) => (dir.indexOf("*") === -1 ? path.join(dir, "/**/*.js") : dir));

  let directFiles = (program.args.length ? program.args : []).filter((file) => file.indexOf("*") === -1 && /\.(js|mjs|jsx|ts|tsx)$/.test(file));

  let files = new Set([...fastGlob.sync(dirs), ...directFiles].map((file) => path.join(process.cwd(), file)));

  for (let file of files) {
    require(file);
  }

  await reporter.onStart(suites);
  return runNext();
}

module.exports = {
  run,
  compare,
  suite,
  before: (...args) => before(...args),
  after: (...args) => after(...args),
  beforeEach: (...args) => beforeEach(...args),
  afterEach: (...args) => afterEach(...args),
  benchmark: (...args) => benchmark(...args)
};
