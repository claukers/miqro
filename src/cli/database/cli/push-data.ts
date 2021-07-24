import { Util, SimpleMap } from "@miqro/core";
import { resolve } from "path";
import { readFileSync } from "fs";
import { Database } from "@miqro/database";

export const main = async (): Promise<void> => {
  const outfile = process.argv[3];
  const models = process.argv[4];
  if (process.argv.length !== 5) {
    throw new Error(`arguments: <outfile> <modelA,..>`);
  }

  if (typeof outfile !== "string") {
    throw new Error(`<outfile> must be a string!`);
  }

  if (typeof models !== "string") {
    throw new Error(`<modelA,..> must be a list of model names!`);
  }

  const modelList = models.split(",").map(o => o.trim());


  Util.loadConfig();
  const db = Database.getInstance();
  await db.start();
  const out: SimpleMap<any[]> = JSON.parse(readFileSync(resolve(process.cwd(), outfile)).toString());
  for (const modelName of modelList) {
    if (out[modelName] && db.models[modelName]) {
      await db.models[modelName].bulkCreate(out[modelName]);
    }
  }
  await db.stop();
}
