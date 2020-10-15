# bench-test

Performance test runner based on Benchmark.js and inspired by Mocha

The purpose of this plugin is not only run benchmarks but to allow the developers to ensure that their application performance does not drops between commits or pull requests. 
By default it will fail if performance drops a certain percentage (2.5% by default). 

To accomplish this task it will save a history based on the current git head id, package version or current date (git by default)

# Table of Contents

- [bench-test](#bench-test)
- [Table of Contents](#table-of-contents)
- [Install](#install)
- [Use](#use)
  - [Hooks](#hooks)
    - [Before](#before)
    - [After](#after)
    - [BeforeEach](#beforeeach)
    - [AfterEach](#aftereach)
    - [OnCycle](#oncycle)
  - [Exclusive tests](#exclusive-tests)
  - [Inclusive tests](#inclusive-tests)
- [Comand-line usage](#comand-line-usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Legal](#legal)



# Install

You can get this library as a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/):

```bash
// With npm
$ npm install bench-test --save
// With yarn
$ yarn add bench-test
```

# Use 

Create a folder for your tests in your project (default `bench`) and put your files in there.

```javascript
let { compare, suite, benchmark } = require("bench-test");

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

## Hooks 

### Before 
### After
### BeforeEach
### AfterEach
### OnCycle

## Exclusive tests

## Inclusive tests

# Comand-line usage

# Roadmap

- Allow hook description
- Allow write pending tests
- Add --bail option
- Add --forbid-only option
- Add --forbid-pending option
- Implement option to load config from package.json or file
- Add require module option

# Contributing
-   Use prettify and eslint to lint your code.
-   Update the readme with an example if you add or change any functionality.

# Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)