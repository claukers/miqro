import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { templates } from "../utils/templates";
import { ConfigPathResolver } from "@miqro/core";
import { loadSequelizeRC } from "../utils/db";

export const main = (): void => {
  const logger = console;
  const modelname = process.argv[3];

  if (process.argv.length !== 4) {
    throw new Error(`arguments: <modelname>`);
  }

  if (typeof modelname !== "string") {
    throw new Error(`<modelname> must be a string!`);
  }



  const config = loadSequelizeRC();

  // disable experimental typescript support
  const typescript = false; //existsSync(resolve(ConfigPathResolver.getBaseDirname(), "tsconfig.json")) ? true : false;
  const modelsFolder = typescript ? resolve(ConfigPathResolver.getBaseDirname(), "src", "models") : config["models-path"];

  if (!existsSync(modelsFolder)) {
    logger.warn(`models folder [${modelsFolder}] doesnt exists!`);
    logger.warn(`creating [${modelsFolder}]!`);
    mkdirSync(modelsFolder, {
      recursive: true
    });
  }

  const modelPath = resolve(modelsFolder, `${modelname.toLowerCase()}${typescript ? ".ts" : ".js"}`);

  if (existsSync(modelPath)) {
    throw new Error(`${modelPath} already exists!`);
  }
  logger.info(`creating [${modelPath}]!`);

  writeFileSync(modelPath, templates.exampleModel(modelname, typescript));

}
