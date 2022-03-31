import {execSync} from "../utils";
import {loadConfig} from "@miqro/core";

export const usage = "usage: [NODE_ENV=development] npx miqro db:migrate [...args]";

export const main = (): void => {

  loadConfig();

  const args = process.argv.slice(3).join(" ");
  execSync(`npx sequelize-cli db:migrate${args ? ` ${args}` : ""}`);
}

