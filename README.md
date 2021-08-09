# bench-test

Performance test runner based on BuffaloBench and inspired by Mocha

The purpose of this plugin is not only run benchmarks but to allow the developers to ensure that their application performance does not drops between commits or pull requests. 
By default it will fail if performance drops a certain percentage (2.5% by default). 

To accomplish this task it will save a history based on the current git head id, package version or current date (git by default)

# Table of Contents

- [bench-test](#bench-test)
- [Table of Contents](#table-of-contents)
- [Install](#install)
- [Use](#use)
  - [Example](#example)
  - [Hooks](#hooks)
  - [Tests](#tests)
  - [Exclusive tests and inclusive tests](#exclusive-tests-and-inclusive-tests)
- [Comand-line usage](#comand-line-usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Legal](#legal)



# Install

You can get this library as a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/):

```bash
// With npm
$ npm install @masquerade-circus/bench-test --save
// With yarn
$ yarn add @masquerade-circus/bench-test
```

# Use 

Create a folder for your tests in your project (default `bench`) and put your files in there.

```javascript
let { compare, suite, benchmark } = require("@masquerade-circus/bench-test");

compare("regex vs string", () => {
  benchmark("RegExp#test", () => /orl/.test("Hello World!"));
  benchmark("String#indexOf", () => "Hello World!".indexOf("o") > -1);
});

suite("suite only", () => {
  benchmark("suite only", () => /o/.test("Hello World!"));
});
```

To run the benchmarks just run from your terminal: 
```bash
$ bench-test
```

It will show somthing like: 
```bash

    Compare: regex vs string
        ✔ RegExp#test 6.104s (15,844,390 ops/sec)
        ✔ String#indexOf 6.075s (495,271,182 ops/sec)
        Compare: regex vs string completed in 12.179s, String#indexOf was fastest by 96.801%

    Suite: suite only
        ✔ suite only 5.871s (22,695,850 ops/sec)
        Suite: suite only passed in 5.871s

3 passing (18.05s)
```

## Example

See the [bench/index.js](bench/index.js) file.

## Hooks 

Bench-test provides the same hooks as mocha, `before()`, `after()`, `beforeEach()` and `afterEach()`. `before()` and `after()` run only once by suite. `beforeEach()` and `afterEach()` run before and after each benchmark respectively. 

## Tests 
Although bench-test is not a test-runner, you can run tests using `expect.js` or another library to check in each cycle that the benchmark is good.

Failed benchmarks, errors or test non cycle will be showed in the terminal as mocha does.

## Exclusive tests and inclusive tests

As with mocha, you can run `only` benchmarks by appending `.only()` or skip them by appending `.skip()` to the desired suite. 

# Comand-line usage

```bash
Usage: bench-test [options] [dirs...]

Performance test runner based on BuffaloBench and inspired by Mocha

Options:
  -v, --version                   Output the version number
  -r, --reporter <spec>           Reporter to use (default: "spec")
  --enable-regressions            Allow benchmark regressions, if false benchmark will fail if there is a regression (default: false)
  --error-margin <margin>         Fail benchmark if performance drops this percentage amount (default: 2.5)
  --ignore-internals              Ignore internal modules when logging (default: true)
  --ignore-node-modules           Ignore node modules when logging (default: true)
  -R, --repository <repository>   Repository to use (default: "file")
  -t, --tag <tag>                 Tag to be used to identify this run (default: "git")
  -T, --tag-date-format <format>  Date format for the date tag (default: "YYYY-MM-DD")
  --file-name <file-name>         File to be used by the file repository (default: "bench/.bench-test.json")
  --require                       Files to require before tests
  -h, --help                      Display help for command

Available reporters:
 - spec

Available repositories:
 - file
```

# Roadmap

- Allow hook description
- Allow to write pending tests
- Add --bail option
- Add --forbid-only option
- Add --forbid-pending option
- Implement option to load config from package.json or file
- Add init command
- Add create command

# Contributing
-   Use prettify and eslint to lint your code.
-   Update the readme with an example if you add or change any functionality.

# Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)