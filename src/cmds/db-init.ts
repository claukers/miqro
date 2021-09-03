import { ConfigPathResolver } from "@miqro/core";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "../utils";
import { initDBConfig } from "../utils/db";
import { templates } from "../utils/templates";

export const main = (): void => {
  const logger = console;

  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  const initEnvFile = (path: string, template: string): void => {
    if (!existsSync(path)) {
      logger.warn(`creating ${path} env file`);
      writeFileSync(path, template);
    } else {
      logger.warn(`${path} already exists!. init will not create it.`);
    }
  };

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
