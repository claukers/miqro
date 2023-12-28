import { execSync } from "child_process";
import { watch, watchFile } from "fs";

export function setupWatch(directory: string, cmd: string, timeout: number = 1000) {
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
    } catch (e) {
      console.error(e);
    }
    running = false;
  }, timeout)
}
