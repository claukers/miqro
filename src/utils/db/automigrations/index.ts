import { getLogger } from "@miqro/core";
import fs from "fs";
import path from "path";
import { loadModels, loadSequelizeRC } from "..";
import { getMigration, parseDifference, reverseModels, sortActions, writeMigration } from "./migrate";

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
    if (!fs.existsSync(sequelizeRC["models-path"])) {
      logger.error("Can't find models directory. Use `sequelize init` to create it");
      return;
    }

    if (!fs.existsSync(sequelizeRC["migrations-path"])) {
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
      previousState = JSON.parse(fs.readFileSync(path.join(sequelizeRC["migrations-path"], "_current.json")).toString());
    } catch (e) {
      previousState = {
        revision: 0,
        version: 1,
        tables: {}
      };
    }

    const { modelsModule } = loadModels({ ["models-path"]: sequelizeRC["models-path"] });

    const sequelizeModule = modelsModule.Sequelize;

    const models = modelsModule.sequelize.models;

    currentState.tables = reverseModels(sequelizeModule, modelsModule.sequelize, models, logger);

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
    if (fs.existsSync(path.join(sequelizeRC["migrations-path"], "_current.json"))) {
      fs.writeFileSync(path.join(sequelizeRC["migrations-path"], "_current_bak.json"),
        fs.readFileSync(path.join(sequelizeRC["migrations-path"], "_current.json"))
      );
    }

    // save current state
    currentState.revision = previousState.revision + 1;
    fs.writeFileSync(path.join(sequelizeRC["migrations-path"], "_current.json"), JSON.stringify(currentState, null, 4));

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
