require("colors");
const figures = require("figures");
const { program } = require("commander");
const term = require("terminal-kit").terminal;
const BaseReporter = require("./base");

program.option("--ignore-internals", "Ignore internal modules when logging", true).option("--ignore-node-modules", "Ignore node modules when logging", true);

function getIndentation(places = 1) {
  let spaces = new Array(places);
  return spaces.fill("    ", 0, places).join("");
}

class SpecReporter extends BaseReporter {
  constructor(repository) {
    super(repository);
  }

  async onStart(suites) {
    await super.onStart(suites);
  }

  // Invoked when a suite is started
  async onStartSuite({ suite, beforeCallbacks }) {
    if (suite.isComparison) {
      term(`\n${getIndentation(1)}${"Compare:".gray} ${suite.name.white}\n`);
    } else {
      term(`\n${getIndentation(1)}${"Suite:".gray} ${suite.name.white}\n`);
    }
    let { beforeError } = await super.onStartSuite({ suite, beforeCallbacks });
    if (beforeError) {
      let summary = getIndentation(2);
      summary += `${this.errorCount}) Before hook: ${beforeError} \n`.red;
      term(summary);
    }
  }

  // Invoked when a suite ends
  async onCompleteSuite({ suite, afterCallbacks }) {
    let { first, percentageDifference, totalTimeInSeconds, afterError, beforeError } = await super.onCompleteSuite({ suite, afterCallbacks });
    let err = afterError || beforeError;
    if (afterError) {
      let summary = getIndentation(2);
      summary += `${this.errorCount}) After hook: ${afterError} \n`.red;
      term(summary);
    }

    let summary = "";
    if (suite.isComparison) {
      summary += `${getIndentation(2)}${"Compare:".gray} ${suite.name.white} ${err ? "failed in".red : "completed in".gray} ${totalTimeInSeconds}s`.gray;
      summary += `, ${first.name.green} ${"was fastest by".gray} ${`${percentageDifference}%`.green}`;
    } else {
      summary += `${getIndentation(2)}${"Suite:".gray} ${suite.name.white} ${err ? "failed in".red : "passed in".gray} ${totalTimeInSeconds}s`.gray;
    }

    summary += "\n";
    term(summary);
  }

  // Invoked when a benchmark starts
  async onStartBenchmark({ suite, benchmark, beforeEachCallbacks }) {
    term(`${getIndentation(2)}${figures.play.gray} ${benchmark.name} ${"running...".gray}`);
    let { beforeEachError } = await super.onStartBenchmark({ suite, benchmark, beforeEachCallbacks });
    if (beforeEachError) {
      let summary = getIndentation(2);
      summary += `${this.errorCount}) Before each hook for ${benchmark.name}: ${beforeEachError} \n`.red;
      term.deleteLine();
      term(summary);
    }
  }

  // Invoked when a benchmark completes
  async onCompleteBenchmark({ suite, benchmark, afterEachCallbacks }) {
    let { err, seconds, speed, isRegression, isImprovement, regression, improvement, afterEachError, beforeEachError } = await super.onCompleteBenchmark({ suite, benchmark, afterEachCallbacks });

    if (!beforeEachError) {
      let summary = getIndentation(2);
      summary += `${err ? `${this.errorCount})`.red : figures.tick[isRegression ? "gray" : "brightGreen"]} `;
      summary += benchmark.name[err ? "red" : "reset"];
      summary += ` ${seconds}s (${speed} ops/sec)`[err ? "red" : "gray"];

      if (isRegression) {
        summary += ` ${figures.cross.brightRed} ${`${regression.percentageDifference}% slower`.red.italic}`;
      }
      if (err) {
        summary = summary.italic;
      }
      if (isImprovement) {
        summary += ` ${figures.tick.brightGreen} ${`${improvement.percentageDifference}% faster`.green.italic}`;
      }
      summary += "\n";
      term.deleteLine();
      term(summary);
    }
    if (afterEachError) {
      let summary = getIndentation(2);
      summary += `${this.errorCount}) After each hook for ${benchmark.name}: ${afterEachError} \n`.red;
      term(summary);
    }
  }

  // Invoked when all the suites have finished
  async onComplete(suites) {
    await super.onComplete(suites);

    term(`\n${`${this.passedBenchmarks} passing`.green} ${`(${this.suitesTimeInSeconds}s)`.gray}`);
    if (this.errorCount) {
      term(`\n${this.errorCount} failing`.red);
    }

    if (this.errorCount) {
      term("\n");
      for (let i = 0, l = this.errors.length; i < l; i++) {
        let { err, benchmarkName, suiteName, stack } = this.errors[i];
        term(`\n${i + 1}) ${suiteName}`);
        term(`\n${getIndentation(1)}${benchmarkName}`);
        term(`\n${getIndentation(2)}${err}`.red.italic);

        for (let { functionName, path, isInternal, isNodeModule } of stack) {
          if ((isInternal && program.ignoreInternals) || (isNodeModule && program.ignoreNodeModules)) {
            continue;
          }
          term(`\n${getIndentation(2)} at ${functionName} ${path}`.gray);
        }
      }
      term("\n");
    }
    term("\n");
    term("\n");

    if (this.errorCount) {
      process.exit(1);
    }
  }
}

module.exports = SpecReporter;
