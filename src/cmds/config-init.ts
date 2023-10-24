import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { ConfigPathResolver, loadConfig } from "@miqro/core";
import { templates } from "../utils/templates.js";

export const usage = "usage: [NODE_ENV=development] npx miqro config:init";

export const main = (): void => {
  const logger = console;

  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args. ${usage}`);
  }

  loadConfig();

  const configPath = ConfigPathResolver.getConfigDirname();

  const initEnvFile = (path: string, template: string): void => {
    if (!existsSync(path)) {
      logger.warn(`creating ${path} env file`);
      writeFileSync(path, template);
    } else {
      logger.warn(`${path} already exists!. init will not create it.`);
    }
  };

  if (!existsSync(configPath)) {
    logger.warn(`[${configPath}] doesnt exists!`);
    mkdirSync(configPath, {
      recursive: true
    });
  }
  initEnvFile(resolve(configPath, `log.env`), templates.logEnvFile);
  initEnvFile(resolve(configPath, `auth.env`), templates.authEnvFile);
  initEnvFile(resolve(configPath, `features.env`), templates.featuresEnvFile);
}
