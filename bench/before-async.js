let { suite, benchmark, before, after, beforeEach, afterEach, beforeCycle, afterCycle } = require("../lib");

suite("Before async", () => {
  before(async () => {
    console.log(1);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(2);
  });

  beforeEach(async () => {
    console.log(3);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(4);
  });

  beforeCycle(async () => {
    console.log(5);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(6);
  });

  afterCycle(async () => {
    console.log(7);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(8);
  });

  afterEach(async () => {
    console.log(9);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(10);
  });

  after(async () => {
    console.log(11);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(12);
  });

  benchmark("Before async", () => /o/.test("Hello World!"));
});
