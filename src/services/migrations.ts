import { Logger } from "@miqro/core";
import { Database, DatabaseLogger, migration } from "@miqro/query";
import { dirname, extname, relative, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";

import { getMigrationsPath } from "../common/paths.js";
import { importJSXFile, inflateJSX } from "../common/jsx.js";

export async function runMigrations(logger: Logger | undefined, db: Database | null, servicePath: string, service: string, inflateDir: string | undefined | false, migrations: string[]) {
  const migrationsFolderPath = getMigrationsPath(servicePath);
  if (migrationsFolderPath) {
    logger?.debug("running migrations from [%s]", service);
    if (!db) {
      throw new Error("cannot run migrations with the database disabled!");
    }
    const serviceMigrations = await migration.up.folder(db as any, migrationsFolderPath, logger as DatabaseLogger, (inFile: string) => importJSXFile(inFile, logger));
    migrations.push(...serviceMigrations);

    if (inflateDir) {
      for (const migration of serviceMigrations) {
        const inflatePath = resolve(inflateDir, service, "migration", migration.substring(0, migration.length - extname(migration).length) + ".js");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger?.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(resolve(migrationsFolderPath, migration), {
          embemedJSX: false,
          minify: false,
          useExport: true,
          platform: "node",
          logger
        }));
      }
    }
  }
  return migrations;
}

export async function runMigrationsDown(logger: Logger | Console | undefined, db: Database | null, servicePath: string, service: string, inflateDir: string | undefined, migrations: string[]) {
  const migrationsFolderPath = getMigrationsPath(servicePath)
  if (migrationsFolderPath) {
    logger?.debug("running migrations from [%s]", service);
    if (!db) {
      throw new Error("cannot run migrations with the database disabled!");
    }
    const serviceMigrations = await migration.down.folder(db as any, migrationsFolderPath, logger as DatabaseLogger, (inFile: string) => importJSXFile(inFile, logger));
    migrations.push(...serviceMigrations);

    if (inflateDir) {
      for (const migration of serviceMigrations) {
        const inflatePath = resolve(inflateDir, service, "migration", migration.substring(0, migration.length - extname(migration).length) + ".js");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger?.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(resolve(migrationsFolderPath, migration), {
          embemedJSX: false,
          platform: "node",
          minify: false,
          useExport: true,
          logger
        }));
      }
    }
  }
  return migrations;
}
