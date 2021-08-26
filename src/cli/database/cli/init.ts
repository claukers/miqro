import { execSync } from "../../utils";
import { initDBConfig } from "../db";

export const main = (): void => {
  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  if (initDBConfig()) {
    execSync(
      `npm install sequelize --save`
    );
    execSync(
      `npm install object-hash --save-dev`
    );
    execSync(
      `npm install deep-diff --save-dev`
    );
    execSync(
      `npm install sequelize-cli --save-dev`
    );
  }
};
