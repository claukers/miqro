import { syncMakeMigrations } from "../utils/db";

export const main = (): void => {
  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  syncMakeMigrations();
}
