import { existsSync, statSync, watch, watchFile } from "fs";
import { execSync } from "../utils/index.js";

const usageMessage = (message?: string) => `${message ? `${message}.\n` : ""}usage: npx miqro watch <directory> <cmd>`;

export const usage = usageMessage();

function setupWatch(directory: string, cmd: string, timeout: number = 1000) {
  watchFile(directory, () => {
    queueRunCMD(cmd, timeout);
  });
  watch(directory, {
    recursive: true
  }, () => {
    queueRunCMD(cmd, timeout);
  });
}

let cmdTimeout: null | NodeJS.Timeout = null;
let running = false;

function queueRunCMD(cmd: string, timeout: number) {
  if (running) {
    return;
  }
  if (cmdTimeout) {
    clearTimeout(cmdTimeout);
  }
  cmdTimeout = setTimeout(() => {
    running = true;
    try {
      execSync(cmd, {
        cwd: process.cwd(),
        env: process.env
      });
    } catch(e) {
      console.error(e);
    }
    running = false;
  }, timeout)
}

export const main = (): void => {

  if (process.argv.length < 5) {
    throw new Error(usageMessage("invalid number of args"));
  }

  const directory = process.argv[3];
  const cmd = process.argv.slice(4).join(" ");
  const timeout = process.env.WATCH_TIMEOUT ? parseInt(process.env.WATCH_TIMEOUT, 10) : undefined;

  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    throw new Error(usageMessage("directory not found!"));
  }

  console.log(`setting up watch on ${directory} with cmd ${cmd}`);
  setupWatch(directory, cmd, timeout);
}

