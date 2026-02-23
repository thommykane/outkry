"use strict";
const path = require("path");
const { spawnSync } = require("child_process");
require("dotenv").config({ path: path.join(process.cwd(), ".env") });
const [exec, ...args] = process.argv.slice(2);
const result = spawnSync(exec, args, { stdio: "inherit", env: process.env, shell: true });
process.exitCode = result.status !== null ? result.status : 1;
