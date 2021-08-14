import { makemigrationsImpl } from "./automigrations";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { templates } from "./../template";
import { ConfigPathResolver } from "@miqro/core";
import { execSync } from "../../utils";

const logger = console;

// noinspection SpellCheckingInspection
export const initDBConfig = (modelsPath?: string, typescript?: boolean): boolean => {
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
