const { program } = require("commander");
const Benchmark = require("benchmark");
const fastGlob = require("fast-glob");
const path = require("path");

const { version, description } = require("../package.json");

program.version(version, "-v, --version", "Output the version number").name("bench-test").description(description).arguments("[dirs...]").helpOption("-h, --help", "Display help for command");

program.option("-r, --reporter <spec>", "Reporter to use", "spec");
const reporters = require("./reporters");

program.option("-R, --repository <repository>", "Repository to use", "file");
const repositories = require("./repositories");

program.option("--require [files...]", "Require files before tests");

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
let onCycle;

const suites = [];
const skip = [];
const only = [];
let nextSuiteIndex = 0;

const repository = new repositories[program.repository]();
const reporter = new reporters[program.reporter](repository);

function runNext() {
  let currentSuite = suites[nextSuiteIndex];
  nextSuiteIndex += 1;

  if (!currentSuite) {
    return reporter.onComplete(suites);
  }

  if ((only.length && only.indexOf(currentSuite.name) === -1) || (skip.length && skip.indexOf(currentSuite.name) > -1) || currentSuite.length === 0) {
    return runNext();
  }

  return currentSuite.run({
    async: true
  });
}

function addSuite({ name, fn, isComparison }) {
  let suite;
  let beforeCallbacks = new Set();
  let afterCallbacks = new Set();
  let beforeEachCallbacks = new Set();
  let afterEachCallbacks = new Set();
  let onCycleCallbacks = new Set();

  before = (callback) => beforeCallbacks.add(callback);
  after = (callback) => afterCallbacks.add(callback);
  beforeEach = (callback) => beforeEachCallbacks.add(callback);
  afterEach = (callback) => afterEachCallbacks.add(callback);
  onCycle = (callback) => onCycleCallbacks.add(callback);

  let options = {
    onStart: () => reporter.onStartSuite({ suite, beforeCallbacks }),
    onComplete: async () => {
      await reporter.onCompleteSuite({ suite, afterCallbacks });
      await runNext();
    }
  };
  suite = new Benchmark.Suite(name, options);
  suite.isComparison = isComparison;

  benchmark = (name, bench) => {
    suite.add(name, bench, {
      async: true,
      onStart: (event) => reporter.onStartBenchmark({ suite, benchmark: event.target, beforeEachCallbacks }),
      onComplete: (event) => reporter.onCompleteBenchmark({ suite, benchmark: event.target, afterEachCallbacks }),
      onCycle: (event) => reporter.onCycleBenchmark({ suite, benchmark: event.target, onCycleCallbacks })
    });
  };

  suites.push(suite);

  fn();
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

  let dirs = (program.args.length ? program.args : ["bench"]).map((dir) => (dir.indexOf("*") === -1 ? dir + "/**.js" : dir));

  let files = fastGlob.sync(dirs);

  for (let file of files) {
    require(path.join(process.cwd(), file));
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
  benchmark: (...args) => benchmark(...args),
  onCycle: (...args) => onCycle(...args)
};
