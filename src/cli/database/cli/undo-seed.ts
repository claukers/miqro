import { loadConfig, ConfigPathResolver } from "@miqro/core";
import { undoSeed } from "../db";
import { resolve } from "path";

export const main = (): void => {
  if (process.argv.length !== 4) {
    throw new Error(`invalid number of args`);
  }

  if (process.argv.length !== 4) {
    throw new Error(`arguments: <seed_file>`);
  }

  loadConfig();

  const filePath = resolve(ConfigPathResolver.getBaseDirname(), process.argv[3]);

  undoSeed(filePath);
}
