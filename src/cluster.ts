#!/usr/bin/env node

import { mainPath } from "@miqro/runner";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { parseArguments } from "./common/arguments.js";
import { checkEnvVariable } from "@miqro/core";
import { cpus } from "node:os";

const __package_dirname = import.meta.url ? resolve(dirname(fileURLToPath(import.meta.url))) : null;

//const usage = "CLUSTER_COUNT=os.cpus().length [CLUSTER_AUTO_BROADCAST=true|false] [CLUSTER_DISABLE_RESTART=true|false]";

const CLUSTER_COUNT = checkEnvVariable("CLUSTER_COUNT", String(cpus().length));

const args = parseArguments();

if (args.inflate || args.test || args.compile || args.installTSConfig || args.installTypes || args.migrateDown || args.migrateUp) {
  await import("./main.js");
} else {
  const CMD = `CLUSTER_COUNT=${CLUSTER_COUNT} CLUSTER_AUTO_BROADCAST=true ${process.argv[0]} ${mainPath()} ${resolve(__package_dirname, "main.js")} ${process.argv.slice(2).join(" ")}`;

  console.log(CMD);

  execSync(CMD, { stdio: 'inherit' });
}
