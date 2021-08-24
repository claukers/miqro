import { checkEnvVariables, loadConfig, SimpleMap } from "@miqro/core";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { loadSequelize } from "@miqro/database";

export const main = async (): Promise<void> => {
  const logger = console;
  const outfile = process.argv[3];
  if (process.argv.length !== 4) {
    throw new Error(`[LIMIT_COUNT=100] arguments: <outfile>`);
  }

  if (typeof outfile !== "string") {
    throw new Error(`<outfile> must be a string!`);
  }

  const [LIMIT_COUNT] = checkEnvVariables(["LIMIT_COUNT"], ["100"]);
  const limit = parseInt(LIMIT_COUNT, 10);

  if (!isNaN(limit) || limit <= 0) {
    throw new Error(`LIMIT_COUNT must be a number grater than 0!`);
  }

  loadConfig();
  const db = loadSequelize();
  const out: SimpleMap<any[]> = {};
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
      out[modelName] = out[modelName].concat(rows.map(r => {
        const ret = r;
        for (const v of r.dataValues) {
          if (r.v instanceof Buffer) {
            ret[v] = r.v.toString("utf-8");
          }
        }
        return ret;
      }));
      offset += limit;
    }
  }
  await db.close();
  writeFileSync(resolve(process.cwd(), outfile), JSON.stringify(out, undefined, 2));
}
