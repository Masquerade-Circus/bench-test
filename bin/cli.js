#!/usr/bin/env node
const { program } = require("commander");
let { run } = require("../lib");
program.parse(process.argv);
run();
