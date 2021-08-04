const { program } = require("commander");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const path = require("path");
const exec = require("child_process").exec;
let packageJson = require(path.join(process.cwd(), "package.json"));

dayjs.extend(utc);

program
  .option("-t, --tag <tag>", "Tag to be used to identify this run", "git")
  .option("-T, --tag-date-format <format>", "Date format for the date tag", "YYYY-MM-DD");

async function getTag(type) {
  return new Promise((resolve, reject) => {
    if (type === "git") {
      return exec("git rev-parse HEAD", (err, tag) => (err ? reject(err) : resolve(String(tag).trim())));
    }

    if (type === "version") {
      return packageJson.version ? resolve(packageJson.version) : reject(new Error("No version found in package.json"));
    }

    if (type === "date") {
      let format = program.tagDateFormat || "YYYY-MM-DD";
      return resolve(dayjs.utc().format(format));
    }

    resolve(type);
  });
}

class BaseRepository {
  runs = [];
  tag = null;

  addRun(suites) {
    let obj = {
      tag: this.tag,
      timestamp: new Date(),
      suites: {}
    };
    for (let suite of suites) {
      obj.suites[suite.name] = {};
      for (let i = 0, l = suite.length; i < l; i++) {
        let benchmark = suite[i];
        if (benchmark.times.cycle) {
          let previousRun = this.getPreviousBenchmarkRun({ suite, benchmark, sameTag: true });
          if (!program.enableRegressions && previousRun && previousRun.hz < benchmark.hz) {
            obj.suites[suite.name][benchmark.name] = previousRun;
          } else {
            obj.suites[suite.name][benchmark.name] = {
              hz: benchmark.hz,
              cycles: benchmark.cycles,
              count: benchmark.count,
              times: benchmark.times
            };
          }
        }
      }
    }
    this.runs.unshift(obj);
  }

  async load() {
    this.runs = [];
    let tag = program.tag;
    if (!tag) {
      tag = "git";
    }

    this.tag = await getTag(tag);
  }

  save() {
    let runs = this.runs;

    let seen = [];
    runs = runs.filter((run) => {
      if (seen.indexOf(run.tag) > -1) {
        return false;
      }
      seen.push(run.tag);
      return true;
    });

    this.runs = runs;
  }

  getPreviousBenchmarkRun({ suite, benchmark, sameTag = false }) {
    for (let run of this.runs) {
      if (sameTag && run.tag !== this.tag) {
        continue;
      }
      if (run.suites[suite.name] && run.suites[suite.name][benchmark.name]) {
        return run.suites[suite.name][benchmark.name];
      }
    }
  }
}

module.exports = BaseRepository;
