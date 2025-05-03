#!/usr/bin/env node

import { spawn } from "node:child_process";
import { Arguments } from "../common/arguments.js";
import { EXIT_CODES } from "../common/constants.js";

export async function compileSH(args: Arguments) {
  return new Promise<void>((resolve, reject) => {
    try {
      process.chdir(args.inflateDir);
      const proc = spawn(`sh`, ["./compile.sh"]);

      proc.stdout.on('data', (data) => {
        console.log(`${data}`);
      });

      proc.stderr.on('data', (data) => {
        console.log(`${data}`);
      });

      proc.on('close', (code) => {
        console.log(`compilation exited with code ${code}`);

        if (code !== 0) {
          process.exit(code);
        } else {
          process.exit(EXIT_CODES.NORMAL_EXIT);
        }
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}
