const fs = require("fs");
const path = require("path");
const { program } = require("commander");

const BaseRepository = require("./base");

program.option("--file-name <file-name>", "File to be used by the file repository", "bench/.bench-test.json");

const filename = path.join(process.cwd(), program.fileName);

class FileRepository extends BaseRepository {
  constructor() {
    super();
  }

  load() {
    super.load();
    return new Promise((resolve, reject) => {
      fs.readFile(filename, "utf8", (err, contents) => {
        if (err) {
          if (err.code === "ENOENT") {
            this.runs = [];
            resolve(this.save().catch(reject));
          }
          return reject(err);
        }

        try {
          this.runs = JSON.parse(contents);
        } catch (e) {
          this.runs = [];
        }

        if (!Array.isArray(this.runs)) {
          this.runs = [];
        }

        resolve();
      });
    });
  }

  async save() {
    await super.save();

    return new Promise((resolve, reject) => {
      let contents = JSON.stringify(this.runs, null, 2);
      fs.writeFile(filename, contents, (err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }
}

module.exports = FileRepository;
