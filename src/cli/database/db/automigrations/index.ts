import { getLogger } from "@miqro/core";
import fs from "fs";
import path from "path";
import hash from "object-hash";
import { loadSequelizeRC } from "@miqro/database";
import { executeMigration, getMigration, parseDifference, reverseModels, sortActions, writeMigration } from "./migrate";

// noinspection JSUnusedGlobalSymbols
export const migrateImpl = async (): Promise<void> => {
  const logger = getLogger("migrate");
  const options = {
    rev: 0,
    pos: 0,
    one: false,
    list: false
  };

  // Windows support
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }

  const {
    migrationsFolder,
    modelsFolder
  } = loadSequelizeRC();

  /* eslint-disable  @typescript-eslint/no-var-requires */
  const sequelize = require(modelsFolder).sequelize;
  const queryInterface = sequelize.getQueryInterface();

  // execute all migration from
  const fromRevision = options.rev;
  let fromPos = options.pos;
  const stop = options.one;

  const migrationFiles = fs.readdirSync(migrationsFolder)
    // filter JS files
    .filter((file) => {
      return (file.indexOf(".") !== 0) && (file.slice(-3) === ".js");
    })
    // sort by revision
    .sort((a, b) => {
      const revA = parseInt(path.basename(a).split("-", 2)[0], 10);
      const revB = parseInt(path.basename(b).split("-", 2)[0], 10);
      if (revA < revB) {
        return -1;
      }
      if (revA > revB) {
        return 1;
      }
      return 0;
    })
    // remove all migrations before fromRevision
    .filter((file) => {
      const rev = parseInt(path.basename(file).split("-", 2)[0], 10);
      return (rev >= fromRevision);
    });

  logger.info("Migrations to execute:");
  migrationFiles.forEach((file) => {
    logger.info("\t" + file);
  });

  if (options.list) {
    logger.info("aki");
    process.exit(0);
  }

  for (const file of migrationFiles) {
    await new Promise<void>((resolve, reject) => {
      logger.info("Execute migration from file: " + file);
      executeMigration(queryInterface, path.join(migrationsFolder, file), fromPos, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }, logger);
      // set pos to 0 for next migration
      fromPos = 0;
    });
    if (stop) {
      return;
    }
  }

};

// noinspection SpellCheckingInspection
export const makemigrationsImpl = (): string | undefined | null => {

  // Windows support
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }



  const {
    migrationsFolder,
    modelsFolder
  } = loadSequelizeRC();

  // noinspection SpellCheckingInspection
  const logger = getLogger("makemigrations");

  try {
    if (!fs.existsSync(modelsFolder)) {
      logger.error("Can't find models directory. Use `sequelize init` to create it");
      return;
    }

    if (!fs.existsSync(migrationsFolder)) {
      logger.error("Can't find migrations directory. Use `sequelize init` to create it");
      return;
    }

    // current state
    const currentState: any = {
      tables: {}
    };

    // load last state
    let previousState: {
      revision: 0;
      version: 1;
      tables: any;
    };

    try {
      previousState = JSON.parse(fs.readFileSync(path.join(migrationsFolder, "_current.json")).toString());
    } catch (e) {
      previousState = {
        revision: 0,
        version: 1,
        tables: {}
      };
    }

    const sequelize = require(modelsFolder).sequelize;

    const models = sequelize.models;

    currentState.tables = reverseModels(sequelize, models, logger, hash);

    const actions = parseDifference(previousState.tables, currentState.tables, logger);

    // sort actions
    sortActions(actions);

    const migration = getMigration(actions);

    if (migration.commandsUp.length === 0) {
      logger.info("No changes found");
      return null;
    }

    // log migration actions
    migration.consoleOut.forEach((v: string) => {
      logger.info("[Actions] " + v);
    });

    // backup _current file
    if (fs.existsSync(path.join(migrationsFolder, "_current.json"))) {
      fs.writeFileSync(path.join(migrationsFolder, "_current_bak.json"),
        fs.readFileSync(path.join(migrationsFolder, "_current.json"))
      );
    }

    // save current state
    currentState.revision = previousState.revision + 1;
    fs.writeFileSync(path.join(migrationsFolder, "_current.json"), JSON.stringify(currentState, null, 4));

    // write migration to file
    const info = writeMigration(currentState.revision,
      migration,
      migrationsFolder,
      "noname",
      "");

    logger.info(`New migration to revision ${currentState.revision} has been saved to file '${info.filename}'`);
    return info.filename;
  } catch (e) {
    logger.error(e);
    throw e;
  }
};
