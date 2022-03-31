import { ConfigPathResolver, loadConfig } from "@miqro/core";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "../utils";
import { initDBConfig } from "../utils/db";
import { templates } from "../utils/templates";

export const usage = "usage: [NODE_ENV=development] npx miqro db:init";

export const main = (): void => {
  const logger = console;

  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args. ${usage}`);
  }

  const initEnvFile = (path: string, template: string): void => {
    if (!existsSync(path)) {
      logger.warn(`creating ${path} env file`);
      writeFileSync(path, template);
    } else {
      logger.warn(`${path} already exists!. init will not create it.`);
    }
  };

  loadConfig();

  if (initDBConfig()) {
    const configPath = ConfigPathResolver.getConfigDirname();
    if (!existsSync(configPath)) {
      logger.warn(`[${configPath}] doesnt exists!`);
      mkdirSync(configPath, {
        recursive: true
      });
    }
    initEnvFile(resolve(configPath, `db.env`), templates.dbEnvFile);
    execSync(
      `npm install sequelize --save`
    );
  }
};
