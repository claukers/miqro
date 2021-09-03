import { checkEnvVariables, SimpleMap } from "@miqro/core";
import { resolve } from "path";
import { readFileSync } from "fs";
import { loadSequelize } from "../utils/db";

export const main = async (): Promise<void> => {
  const outfile = process.argv[3];
  const models = process.argv[4];
  if (process.argv.length !== 5) {
    throw new Error(`[BULK_CREATE_COUNT=100] arguments: <outfile> <modelA,..>`);
  }

  if (typeof outfile !== "string") {
    throw new Error(`<outfile> must be a string!`);
  }

  if (typeof models !== "string") {
    throw new Error(`<modelA,..> must be a list of model names!`);
  }

  const [BULK_CREATE_COUNT] = checkEnvVariables(["BULK_CREATE_COUNT"], ["100"]);
  const bulkCount = parseInt(BULK_CREATE_COUNT, 10);

  if (isNaN(bulkCount) || bulkCount < 0) {
    throw new Error(`BULK_CREATE_COUNT must be a number grater or equal than 0!`);
  }

  const modelList = models.split(",").map(o => o.trim());

  const db = loadSequelize();
  const out: SimpleMap<any[]> = JSON.parse(readFileSync(resolve(process.cwd(), outfile)).toString());
  for (const modelName of modelList) {
    if (out[modelName] && db.models[modelName]) {
      const list = out[modelName].map(i => {
        const ret = {};
        const attrs = Object.keys(i);
        for (const a of attrs) {
          ret[a] = i[a] && i[a].type === "Buffer" ? Buffer.from(i[a]) : i[a];
        }
        return ret;
      });
      if (bulkCount === 0) {
        for (const m of list) {
          await db.models[modelName].create(m);
        }
      } else {
        let current;
        while ((current = list.splice(0, bulkCount)).length > 0) {
          await db.models[modelName].bulkCreate(current);
        }
      }
    }
  }
  await db.close();
}
