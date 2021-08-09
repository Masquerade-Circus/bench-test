let { suite, benchmark, before, after, beforeEach, afterEach } = require("../lib");

suite("Before async", () => {
  before(async () => {
    console.log(1);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(2);
  });

  after(async () => {
    console.log(3);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(4);
  });

  beforeEach(async () => {
    console.log(5);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(6);
  });

  afterEach(async () => {
    console.log(7);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(8);
  });

  benchmark("Before async", () => /o/.test("Hello World!"));
});
