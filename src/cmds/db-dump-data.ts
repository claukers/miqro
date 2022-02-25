import { checkEnvVariables, loadConfig } from "@miqro/core";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { loadSequelize } from "../utils/db";

export const usage = "usage: [NODE_ENV=development] [LIMIT_COUNT=100] npx miqro db:dump:data <outfile>";

export const main = async (): Promise<void> => {
  const logger = console;
  const outfile = process.argv[3];
  if (process.argv.length !== 4) {
    throw new Error(`invalid number of args. ${usage}`);
  }

  if (typeof outfile !== "string") {
    throw new Error(`<outfile> must be a string!`);
  }

  const [LIMIT] = checkEnvVariables(["LIMIT"], ["100"]);
  const limit = parseInt(LIMIT, 10);

  if (isNaN(limit) || limit <= 0) {
    throw new Error(`LIMIT must be a number grater than 0!`);
  }

  loadConfig();

  const db = loadSequelize();
  const out: { [key: string]: any[] } = {};
  logger.info(`beware that if the model is not implicitly defined in db.models it will be dumped.`);
  const models = Object.keys(db.models);
  for (const modelName of models) {
    let rows;
    let offset = 0;
    out[modelName] = [];
    while ((rows = await db.models[modelName].findAndCountAll({
      offset,
      limit
    })).rows.length > 0) {
      out[modelName] = out[modelName].concat(rows.rows);
      offset += limit;
    }
  }
  await db.close();
  writeFileSync(resolve(process.cwd(), outfile), JSON.stringify(out, undefined, 2));
}
