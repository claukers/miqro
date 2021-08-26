import { makemigrationsImpl } from "./automigrations";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { templates } from "./../template";
import { ConfigFileNotFoundError, ConfigPathResolver, getLogger, Logger, parse } from "@miqro/core";
import { execSync } from "../../utils";

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
    throw new ConfigFileNotFoundError(`missing .sequelizerc file. maybe you didnt init your db config.`);
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

export const loadSequelize = (args?: { "models-path": string }, l?: Logger): any => {
  const logger = l ? l : getLogger("Database");
  const sequelizerc = args ? args : loadSequelizeRC();
  const { sequelize } = require(sequelizerc["models-path"]);
  if (!sequelize || typeof sequelize !== "object" || typeof sequelize.models !== "object") {
    throw new Error(`${sequelizerc["models-path"]} doesnt export sequelize`);
  }
  sequelize.log = (text: string): void => {
    logger.info(text);
  };
  return sequelize;
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
      const typescript = existsSync(resolve(ConfigPathResolver.getBaseDirname(), "tsconfig.json")) ? true : false;
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

export const migrate = (): void => {
  try {
    // noinspection SpellCheckingInspection
    execSync(
      "npx sequelize-cli db:migrate",
      {
        cwd: dirname(ConfigPathResolver.getSequelizeRCFilePath())
      }
    );
  } catch (e) {
    logger.error(e.message);
    throw e;
  }
};

export const undoMigrate = (): void => {
  try {
    // noinspection SpellCheckingInspection
    execSync(
      "npx sequelize-cli db:migrate:undo:all",
      {
        cwd: dirname(ConfigPathResolver.getSequelizeRCFilePath())
      }
    );
  } catch (e) {
    logger.error(e.message);
    throw e;
  }
};

export const migrateStatus = (): void => {
  try {
    // noinspection SpellCheckingInspection
    execSync(
      "npx sequelize-cli db:migrate:status",
      {
        cwd: dirname(ConfigPathResolver.getSequelizeRCFilePath())
      }
    );
  } catch (e) {
    logger.error(e.message);
    throw e;
  }
};

export const seed = (seedPath?: string): void => {
  try {
    // noinspection SpellCheckingInspection
    execSync(
      seedPath ? `npx sequelize-cli db:seed --seed ${seedPath}` : "npx sequelize-cli db:seed:all",
      {
        cwd: dirname(ConfigPathResolver.getSequelizeRCFilePath())
      }
    );
  } catch (e) {
    logger.error(e.message);
    throw e;
  }
};

export const undoSeed = (seedPath?: string): void => {
  try {
    // noinspection SpellCheckingInspection
    execSync(
      seedPath ? `npx sequelize-cli db:seed:undo --seed ${seedPath}` : "npx sequelize-cli db:seed:undo:all",
      {
        cwd: dirname(ConfigPathResolver.getSequelizeRCFilePath())
      }
    );
  } catch (e) {
    logger.error(e.message);
    throw e;
  }
};
