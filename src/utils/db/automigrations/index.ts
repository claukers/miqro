import { getLogger } from "@miqro/core";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { loadModels, loadSequelizeRC } from "..";
import { getMigration, MigrationState, parseDifference, reverseModels, sortActions, writeMigration } from "./migrate";

export const syncMakeMigrationsImpl = (): void => {
  // Windows support
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }

  const sequelizeRC = loadSequelizeRC();

  // noinspection SpellCheckingInspection
  const logger = getLogger("makemigrations");

  try {
    if (!existsSync(sequelizeRC["models-path"])) {
      logger.error("Can't find models directory. Use `sequelize init` to create it");
      return;
    }

    if (!existsSync(sequelizeRC["migrations-path"])) {
      logger.error("Can't find migrations directory. Use `sequelize init` to create it");
      return;
    }

    // load last state
    let previousState: MigrationState;

    try {
      previousState = JSON.parse(readFileSync(join(sequelizeRC["migrations-path"], "_current.json")).toString());
    } catch (e) {
      previousState = {
        revision: 0,
        tables: {}
      };
    }

    const { modelsModule } = loadModels({ ["models-path"]: sequelizeRC["models-path"] });

    // current state
    const currentState: MigrationState = {
      revision: previousState.revision + 1,
      tables: reverseModels(modelsModule.Sequelize, modelsModule.sequelize, modelsModule.sequelize.models, logger)
    };


    // backup _current file
    if (existsSync(join(sequelizeRC["migrations-path"], "_current.json"))) {
      writeFileSync(join(sequelizeRC["migrations-path"], "_current_bak.json"),
        readFileSync(join(sequelizeRC["migrations-path"], "_current.json"))
      );
    }

    // save current state
    currentState.revision = previousState.revision + 1;
    writeFileSync(join(sequelizeRC["migrations-path"], "_current.json"), JSON.stringify(currentState, null, 4));
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

// noinspection SpellCheckingInspection
export const makemigrationsImpl = (): string | undefined | null => {

  // Windows support
  if (!process.env.PWD) {
    process.env.PWD = process.cwd();
  }

  const sequelizeRC = loadSequelizeRC();

  // noinspection SpellCheckingInspection
  const logger = getLogger("makemigrations");

  try {
    if (!existsSync(sequelizeRC["models-path"])) {
      logger.error("Can't find models directory. Use `sequelize init` to create it");
      return;
    }

    if (!existsSync(sequelizeRC["migrations-path"])) {
      logger.error("Can't find migrations directory. Use `sequelize init` to create it");
      return;
    }

    // load last state
    let previousState: MigrationState;

    try {
      previousState = JSON.parse(readFileSync(join(sequelizeRC["migrations-path"], "_current.json")).toString());
    } catch (e) {
      previousState = {
        revision: 0,
        tables: {}
      };
    }

    const { modelsModule } = loadModels({ ["models-path"]: sequelizeRC["models-path"] });

    // current state
    const currentState: MigrationState = {
      revision: previousState.revision + 1,
      tables: reverseModels(modelsModule.Sequelize, modelsModule.sequelize, modelsModule.sequelize.models, logger)
    };

    const actions = parseDifference(previousState.tables, currentState.tables, logger);

    // sort actions
    sortActions(actions);

    const migration = getMigration(actions);

    if (migration.commandsUp.length === 0) {
      logger.info("No changes found");
      return null;
    }

    // log migration actions
    migration.consoleOut.forEach((v) => {
      logger.info("[Actions] " + v);
    });

    // backup _current file
    if (existsSync(join(sequelizeRC["migrations-path"], "_current.json"))) {
      writeFileSync(join(sequelizeRC["migrations-path"], "_current_bak.json"),
        readFileSync(join(sequelizeRC["migrations-path"], "_current.json"))
      );
    }

    // save current state
    currentState.revision = previousState.revision + 1;
    writeFileSync(join(sequelizeRC["migrations-path"], "_current.json"), JSON.stringify(currentState, null, 4));

    // write migration to file
    const info = writeMigration(currentState.revision,
      migration,
      sequelizeRC["migrations-path"],
      "noname",
      "");

    logger.info(`New migration to revision ${currentState.revision} has been saved to file '${info.filename}'`);
    return info.filename;
  } catch (e) {
    logger.error(e);
    throw e;
  }
};
