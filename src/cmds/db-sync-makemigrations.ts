import { syncMakeMigrations } from "../utils/db";
import { loadConfig } from "@miqro/core";

export const main = (): void => {
  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  loadConfig();

  syncMakeMigrations();
}
