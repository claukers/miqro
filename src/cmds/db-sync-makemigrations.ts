import { syncMakeMigrations } from "../utils/db";
import { loadConfig } from "@miqro/core";

export const usage = "usage: [NODE_ENV=development] npx miqro db:migration:forceclean";

export const main = (): void => {
  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  loadConfig();

  syncMakeMigrations();
}
