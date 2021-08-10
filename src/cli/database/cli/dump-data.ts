import { loadConfig, SimpleMap } from "@miqro/core";
import { resolve } from "path";
import { writeFileSync } from "fs";
import { Database } from "@miqro/database";

export const main = async (): Promise<void> => {
  const logger = console;
  const outfile = process.argv[3];
  if (process.argv.length !== 4) {
    throw new Error(`arguments: <outfile>`);
  }

  if (typeof outfile !== "string") {
    throw new Error(`<outfile> must be a string!`);
  }

  loadConfig();
  const db = Database.getInstance();
  await db.start();
  const out: SimpleMap<any[]> = {};
  logger.info(`beware that if the model is not implicitly defined in db.models it will be dumped.`);
  const models = Object.keys(db.models);
  for (const modelName of models) {
    const rows = await db.models[modelName].findAll();
    out[modelName] = rows;
  }
  await db.stop();
  writeFileSync(resolve(process.cwd(), outfile), JSON.stringify(out, undefined, 2));
}
