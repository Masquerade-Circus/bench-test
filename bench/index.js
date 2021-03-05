const expect = require("expect");
let { compare, suite, benchmark, after, before, beforeEach, afterEach, onCycle } = require("../lib");

compare.only("regex vs string", () => {
  // before(() => console.log("Before log"));
  // after(() => console.log("After log"));
  // beforeEach(() => console.log("Before each"));
  // afterEach(() => console.log("After each"));
  benchmark("RegExp#test", () => /orl/.test("Hello World!"));
  benchmark("String#indexOf", () => "Hello World!".indexOf("o") > -1);
});

suite.only("suite only", () => {
  benchmark("suite only", () => /o/.test("Hello World!"));
});

suite.skip("suite skipped", () => {
  benchmark("RegExp#test", () => /o/.test("Hello World!"));
});

suite("suite", () => {
  benchmark("RegExp#test", () => /o/.test("Hello World!"));
});

suite.only("empty suite", () => {});
compare.only("empty compare", () => {});

suite.only("Intended errors", () => {
  benchmark("Normal error", () => {
    throw new Error("Intended error");
  });

  benchmark("expect.js error", () => {
    expect({
      hola: "mundo"
    }).toEqual({
      hello: "world"
    });
  });
});

suite.only("before error", () => {
  before(() => {
    throw new Error("Intended error");
  });
  benchmark("RegExp#test", () => /o/.test("Hello World!"));
});

suite.only("after error", () => {
  after(() => {
    throw new Error("Intended error");
  });
  benchmark("RegExp#test", () => /o/.test("Hello World!"));
});

suite.only("before each error", () => {
  beforeEach(() => {
    throw new Error("Intended error");
  });
  benchmark("RegExp#test", () => /o/.test("Hello World!"));
});

suite.only("after each error", () => {
  afterEach(() => {
    throw new Error("Intended error");
  });
  benchmark("RegExp#test", () => /o/.test("Hello World!"));
});

suite.only("onClycle", () => {
  let count = 0;

  onCycle(() => count++);

  afterEach(() => {
    console.log(count);
  });
  benchmark("RegExp#test", () => /o/.test("Hello World!"));
});
