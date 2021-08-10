import { loadConfig } from "@miqro/core";
import { undoSeed } from "../db";

export const main = (): void => {
  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  loadConfig();
  undoSeed();
}
