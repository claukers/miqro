import { Logger } from "@miqro/core";
import { Migration, migration } from "@miqro/query";
import { importDBConfigModule, importMigrationModule, InflateError, inflateJSX } from "../common/jsx.js";
import { getDBConfigPath, getMigrationsPath, getServicePath } from "../common/paths.js";
import { dirname, extname, relative, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";
import { DBConfig, NamedMigration } from "../types.js";

export interface MigrationModule extends Migration, NamedMigration {

}

export async function inflateDBConfig(logger: Logger, service: string, dbConfigList: DBConfig[] | undefined, inflateDir: string | undefined | false, errors: InflateError[]) {
  const servicePath = getServicePath(service);
  const dbConfigPath = getDBConfigPath(servicePath);
  if (dbConfigPath) {
    try {
      //logger.debug("loading DBConfig for service[%s]", service);
      const config = await importDBConfigModule(dbConfigPath, logger);
      if (config && dbConfigList && dbConfigList.filter(c => c.name === config.name).length > 0) {
        throw new Error(`ws path [${config.name}] already defined! error from [${dbConfigPath}]`);
      } else if (config) {
        //logger.debug("DBConfig [%s] loaded from service [%s]", config.name, service);
        if (dbConfigList) {
          dbConfigList.push(config);
        }
      }


      if (config) {
        if (inflateDir) {
          const inflatePath = resolve(inflateDir, service, "db.js");
          mkdirSync(dirname(inflatePath), {
            recursive: true
          });
          logger.log("writing [%s]", relative(cwd(), inflatePath));
          writeFileSync(inflatePath, await inflateJSX(dbConfigPath, {
            embemedJSX: false,
            minify: false,
            useExport: true,
            logger
          }));
        }

        //const db = await dbManager.setupDB(service, config);

        //return db;
        return config;
      }
    } catch (e) {
      errors.push({
        filePath: dbConfigPath,
        error: e
      });
      logger.error("error with " + dbConfigPath);
      logger.error(e);
      return false;
    }
  }
  return false;
}

export async function inflateDBMigrations(logger: Logger, service: string, dbName: string, inflateDir: string | undefined | false, errors: InflateError[]) {
  const servicePath = getServicePath(service);
  const migrationsFolderPath = getMigrationsPath(servicePath);
  if (migrationsFolderPath) {

    logger?.trace("loading migrations from service [%s]", service);

    const serviceMigrations = migration.getSortedMigrations(migrationsFolderPath);

    const migrationModules: MigrationModule[] = [];

    for (const migrationName of serviceMigrations) {
      const migrationPath = resolve(migrationsFolderPath, migrationName);
      try {
        const migrationModule = await importMigrationModule(migrationPath);
        migrationModules.push({
          name: migrationName,
          service,
          dbName,
          ...migrationModule
        });

        if (inflateDir) {
          const inflatePath = resolve(inflateDir, service, "migration", migrationName.substring(0, migrationName.length - extname(migrationName).length) + ".js");
          mkdirSync(dirname(inflatePath), {
            recursive: true
          });
          logger?.log("writing [%s]", relative(cwd(), inflatePath));
          writeFileSync(inflatePath, await inflateJSX(resolve(migrationsFolderPath, migrationName), {
            embemedJSX: false,
            minify: false,
            useExport: true,
            logger
          }));
        }

      } catch (e) {
        errors.push({
          filePath: migrationPath,
          error: e
        });
        logger.error("error with " + migrationPath);
        logger.error(e);
        return false;
      }
    }

    return migrationModules;

  }
  return false;
}
