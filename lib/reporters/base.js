const { CompareBy } = require("buffalo-bench/dist/index.min");
const { program } = require("commander");

program.option("--enable-regressions", "Allow benchmark regressions, if false benchmark will fail if there is a regression", false);
program.option("--error-margin <margin>", "Fail benchmark if performance drops this percentage amount", 2.5);

function formatNumber(num) {
  let n = Number(Number(num).toFixed(2));
  n = n > 1000 ? Math.round(n) : n;
  let s = String(n);
  let sparts = s.split(".");
  let s1 = sparts[0];
  let s2 = sparts[1] || "00";
  return (
    [
      ...[...s1]
        .reverse()
        .join("")
        .replace(/(\d{3})(?=\d)/g, "$1,")
    ]
      .reverse()
      .join("") +
    "." +
    s2
  );
}

function getStack(err) {
  let stack = err.stack.match(/\s*at.*\)\n/gi);

  let logStack = [];

  for (let logLineDetails of stack) {
    logLineDetails = logLineDetails.trim().replace("\n", "");
    let isInternal = /\(internal\//gi.test(logLineDetails);
    let isNodeModule = /\/node_modules\//gi.test(logLineDetails);
    let functionName = "";
    if (/\s\(.*\)/gi.test(logLineDetails)) {
      functionName = logLineDetails
        .replace(/^at\s+/, "")
        .replace(/\s\(.*\)/gi, "")
        .replace("async ", "")
        .replace(/\[.*\]/gi, "")
        .replace(/(Object|Context)\./gi, "");
    }
    let path = logLineDetails.replace(/.*\s?\((.*)\)$/gi, "$1").replace(/\d\),/gi, "");
    logStack.push({
      functionName,
      path,
      isInternal,
      isNodeModule
    });
  }

  return logStack;
}

let now = typeof performance !== "undefined" && performance.now ? performance.now : Date.now;

class BaseReporter {
  startTime = null;
  endTime = null;
  totalTimeInSeconds = null;
  suitesTimeInSeconds = null;
  benchmarkCount = 0;
  errorCount = 0;
  passedBenchmarks = 0;
  benchmarkLength = 0;
  errors = [];

  constructor(repository) {
    this.repository = repository;
  }

  // Invoked when the runner starts
  async onStart(suites) {
    this.startTime = now();
    this.benchmarkLength = suites.reduce((count, suite) => count + suite.benchmarks.length, 0);
    await this.repository.load();
  }

  // Invoked when a suite is started
  async onStartSuite({ suite, beforeCallbacks }) {
    let beforeError = null;
    try {
      for (let callback of beforeCallbacks) {
        await callback();
      }
    } catch (error) {
      beforeError = error;
      suite.error = error;
      this.errorCount += 1;
      this.errors.push({
        err: error,
        benchmarkName: "before hook",
        suiteName: suite.name,
        stack: getStack(error)
      });
    }

    return { beforeError };
  }

  // Invoked when a suite ends
  async onCompleteSuite({ suite, afterCallbacks }) {
    let totalTimeInSeconds = Number((suite.totalTime / 1000).toFixed(2));
    let sortedSuites;
    let first;
    let second;
    let difference;
    let percentageDifference;

    if (suite.isComparison && suite.benchmarks.length) {
      let benchmarks = suite.getSortedBenchmarksBy(CompareBy.Hz);
      first = benchmarks[0];
      second = benchmarks[benchmarks.length - 1];
      percentageDifference = Math.trunc(((100 / second.hz) * first.hz - 100) * 100) / 100;
    }

    let afterError = null;

    try {
      for (let callback of afterCallbacks) {
        await callback();
      }
    } catch (error) {
      afterError = error;
      suite.error = error;
      this.errorCount += 1;
      this.errors.push({
        err: error,
        benchmarkName: "after hook",
        suiteName: suite.name,
        stack: getStack(error)
      });
    }

    return {
      afterError,
      beforeError: suite.error,
      sortedSuites,
      first,
      second,
      difference,
      percentageDifference,
      totalTimeInSeconds
    };
  }

  // Invoked when a benchmark starts
  async onStartBenchmark({ suite, benchmark, beforeEachCallbacks }) {
    let beforeEachError = null;
    try {
      for (let callback of beforeEachCallbacks) {
        await callback();
      }
    } catch (error) {
      beforeEachError = error;
      this.errorCount += 1;
      benchmark.beforeEachError = beforeEachError;
      this.errors.push({
        err: error,
        benchmarkName: `beforeEach hook for ${benchmark.name}`,
        suiteName: suite.name,
        stack: getStack(error)
      });
    }
    this.benchmarkCount += 1;
    return { beforeEachError };
  }

  async onStartCycle({ suite, benchmark, beforeCycleCallbacks }) {
    let beforeCycleError = null;
    try {
      for (let callback of beforeCycleCallbacks) {
        await callback();
      }
    } catch (error) {
      beforeCycleError = error;
      this.errorCount += 1;
      benchmark.beforeEachError = beforeCycleError;
      this.errors.push({
        err: error,
        benchmarkName: `beforeCycle hook for ${benchmark.name}`,
        suiteName: suite.name,
        stack: getStack(error)
      });
    }
    this.benchmarkCount += 1;
    return { beforeCycleError };
  }

  async onCompleteCycle({ suite, benchmark, afterCycleCallbacks }) {
    let afterCycleError = null;
    try {
      for (let callback of afterCycleCallbacks) {
        await callback();
      }
    } catch (error) {
      afterCycleError = error;
      this.errorCount += 1;
      benchmark.beforeEachError = afterCycleError;
      this.errors.push({
        err: error,
        benchmarkName: `afterCycle hook for ${benchmark.name}`,
        suiteName: suite.name,
        stack: getStack(error)
      });
    }
    this.benchmarkCount += 1;
    return { afterCycleError };
  }

  // Invoked when a benchmark completes
  async onCompleteBenchmark({ suite, benchmark, afterEachCallbacks }) {
    let seconds = parseFloat(benchmark.totalTime / 1000).toFixed(2);
    let speed = formatNumber(benchmark.hz.toFixed(3));
    let previousRun = this.repository.getPreviousBenchmarkRun({ suite, benchmark, sameTag: true });
    let improvement = this.getImprovementSummary({ benchmark, previousRun });
    let regression = this.getRegressionSummary({ benchmark, previousRun });

    let isRegression = Object.keys(regression).length > 0;
    let isImprovement = Object.keys(improvement).length > 0;

    if (!benchmark.error && isRegression && !program.opts().enableRegressions) {
      benchmark.error = new Error("Regression error");
    }

    if (benchmark.beforeEachError || benchmark.error) {
      if (!benchmark.beforeEachError) {
        this.errorCount += 1;
        this.errors.push({
          err: benchmark.error,
          benchmarkName: benchmark.name,
          suiteName: suite.name,
          stack: getStack(benchmark.error)
        });
      }
    } else {
      this.passedBenchmarks += 1;
    }

    let afterEachError = null;
    try {
      for (let callback of afterEachCallbacks) {
        await callback();
      }
    } catch (error) {
      afterEachError = error;
      benchmark.error = error;
      this.errorCount += 1;
      this.errors.push({
        err: error,
        benchmarkName: `afterEach hook for ${benchmark.name}`,
        suiteName: suite.name,
        stack: getStack(error)
      });
    }

    return {
      afterEachError,
      beforeEachError: benchmark.beforeEachError,
      err: benchmark.error || null,
      errorNumber: this.errorCount,
      seconds,
      speed,
      isRegression,
      isImprovement,
      improvement,
      regression
    };
  }

  getRegressionSummary({ benchmark, previousRun }) {
    if (previousRun) {
      let difference = previousRun.hz - benchmark.hz;
      let percentageDifference = parseFloat(((difference / previousRun.hz) * 100).toFixed(3));
      if (percentageDifference >= program.opts().errorMargin) {
        return {
          difference,
          percentageDifference
        };
      }
    }

    return {};
  }

  getImprovementSummary({ benchmark, previousRun }) {
    if (previousRun) {
      let difference = benchmark.hz - previousRun.hz;
      let percentageDifference = parseFloat(((difference / benchmark.hz) * 100).toFixed(3));
      if (percentageDifference >= program.opts().errorMargin) {
        return {
          difference,
          percentageDifference
        };
      }
    }

    return {};
  }

  // Invoked when all the suites have finished
  async onComplete(suites) {
    this.suitesTimeInSeconds = parseFloat(suites.reduce((totalTime, suite) => totalTime + suite.totalTime, 0).toFixed(3));
    this.endTime = Date.now();
    this.totalTimeInSeconds = parseFloat(((this.endTime - this.startTime) / 1000).toFixed(3));
    this.repository.addRun(suites);
    await this.repository.save();
  }
}

module.exports = BaseReporter;
