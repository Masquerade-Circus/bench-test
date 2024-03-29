const expect = require("expect");
let { compare, suite, benchmark, after, before, beforeEach, afterEach } = require("../lib");

compare.only("regex vs string", () => {
  // before(() => console.log("Before log"));
  // after(() => console.log("After log"));
  // beforeEach(() => console.log("Before each"));
  // afterEach(() => console.log("After each"));
  benchmark("RegExp#test", () => /orl/.test("Hello World!"));
  benchmark("String#indexOf", () => "Hello World!".indexOf("orl") > -1);
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

suite("Setup and teardown", () => {
  let a;
  benchmark("a = 1", () => {
    expect(a).toBe(1);
  });
});
