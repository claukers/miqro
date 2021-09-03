import { makemigrationsImpl } from "./automigrations";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { templates } from "../../utils/templates";
import { ConfigFileNotFoundError, ConfigPathResolver, getLogger, Logger, parse } from "@miqro/core";

const logger = console;

export interface SequelizeRC {
  // noinspection SpellCheckingInspection
  config: string;
  "migrations-path": string;
  "seeders-path": string;
  "models-path": string;
}

export const loadSequelizeRC = (sequelizercPath: string = ConfigPathResolver.getSequelizeRCFilePath(), logger?: Logger): SequelizeRC => {
  // noinspection SpellCheckingInspection
  if (!existsSync(sequelizercPath)) {
    // noinspection SpellCheckingInspection
    throw new ConfigFileNotFoundError(`missing ${sequelizercPath} file. maybe you didnt init your db config.`);
  } else {
    if (logger) {
      logger.debug(`loading sequelize config from [${sequelizercPath}]`);
    }
    // noinspection SpellCheckingInspection
    /* eslint-disable  @typescript-eslint/no-var-requires */
    const sequelizerc: SequelizeRC = require(sequelizercPath);
    return parse(sequelizercPath, sequelizerc, [
      { name: "config", type: "string", required: true },
      { name: "migrations-path", type: "string", required: true },
      { name: "seeders-path", type: "string", required: true },
      { name: "models-path", type: "string", required: true }
    ], "no_extra") as SequelizeRC;
  }
};

export const loadModels = (args?: { "models-path": string }): { path: string; modelsModule: any } => {
  const sequelizerc = args ? args : loadSequelizeRC();
  const modelsModule = require(sequelizerc["models-path"]);
  return {
    path: sequelizerc["models-path"],
    modelsModule
  };
}

export const loadSequelize = (args?: { "models-path": string }, l?: Logger): any => {
  const logger = l ? l : getLogger("Database");
  const { modelsModule, path } = loadModels();
  if (!modelsModule.sequelize || typeof modelsModule.sequelize !== "object" || typeof modelsModule.sequelize.models !== "object") {
    throw new Error(`${path} doesnt export sequelize`);
  }
  modelsModule.sequelize.log = (text: string): void => {
    logger.info(text);
  };
  return modelsModule.sequelize;
}


// noinspection SpellCheckingInspection
export const initDBConfig = (): boolean => {
  try {
    const initDir = (p: string): void => {
      if (!existsSync(p)) {
        logger.warn(`creating ${p}`);
        mkdirSync(p);
      } else {
        logger.warn(`${p} already exists!. init will not create it.`);
      }
    };

    const initFile = (p: string, template: string): void => {
      if (!existsSync(p)) {
        logger.warn(`creating ${p} file`);
        writeFileSync(p, template);
      } else {
        logger.warn(`${p} already exists!. init will not create it.`);
      }
    };

    // noinspection SpellCheckingInspection
    const sequelizercPath = resolve(ConfigPathResolver.getBaseDirname(), ".sequelizerc");
    if (existsSync(sequelizercPath)) {
      logger.warn(`.sequelizerc already exists!. init will do nothing.`);
      return false;
    } else {
      // disable experimental typescript support
      const typescript = false; //existsSync(resolve(ConfigPathResolver.getBaseDirname(), "tsconfig.json")) ? true : false;
      const dbFolder = resolve(ConfigPathResolver.getBaseDirname(), "db");
      const migrationsFolder = resolve(dbFolder, "migrations");
      const modelsFolder = typescript ? resolve("src", "models") : resolve(dbFolder, "models");
      const seedersFolder = resolve(dbFolder, "seeders");
      const modelLoaderPath = resolve(modelsFolder, typescript ? "index.ts" : "index.js");
      const dbConfigFilePath = resolve(dbFolder, "connection.js");
      // noinspection SpellCheckingInspection
      initFile(sequelizercPath, templates.sequelizerc(typescript));
      initDir(dbFolder);
      initFile(dbConfigFilePath, templates.dbConfig);
      initDir(migrationsFolder);
      initDir(modelsFolder);
      initFile(modelLoaderPath, templates.modelsIndex);
      initDir(seedersFolder);
    }
    return true;
  } catch (e) {
    logger.error(e.message);
    throw e;
  }
};

// noinspection SpellCheckingInspection
export const makemigrations = (): void => {
  try {
    makemigrationsImpl();
  } catch (e) {
    logger.error(e.message);
    throw e;
  }
};
