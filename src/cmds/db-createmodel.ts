import {existsSync, mkdirSync, writeFileSync} from "fs";
import {resolve} from "path";
import {templates} from "../utils/templates";
import {loadConfig} from "@miqro/core";
import {loadSequelizeRC} from "../utils/db";

export const usage = "usage: [NODE_ENV=development] npx miqro db:create:model <modelname>";

export const main = (): void => {
  const logger = console;
  const modelName = process.argv[3];

  if (process.argv.length !== 4) {
    throw new Error(usage);
  }

  if (typeof modelName !== "string") {
    throw new Error(`<modelname> must be a string!`);
  }

  loadConfig();

  const config = loadSequelizeRC();

  // disable experimental typescript support
  const modelsFolder = config["models-path"];

  if (!existsSync(modelsFolder)) {
    logger.warn(`models folder [${modelsFolder}] doesnt exists!`);
    logger.warn(`creating [${modelsFolder}]!`);
    mkdirSync(modelsFolder, {
      recursive: true
    });
  }

  const modelPath = resolve(modelsFolder, `${modelName.toLowerCase()}.js`);

  if (existsSync(modelPath)) {
    throw new Error(`${modelPath} already exists!`);
  }
  logger.info(`creating [${modelPath}]!`);

  writeFileSync(modelPath, templates.exampleModel(modelName));

}
