import { checkEnvVariables, SimpleMap, loadConfig } from "@miqro/core";
import { resolve } from "path";
import { readFileSync } from "fs";
import { loadSequelize } from "../utils/db";

export const main = async (): Promise<void> => {
  const outfile = process.argv[3];
  const models = process.argv[4];
  if (process.argv.length !== 5) {
    throw new Error(`[BULK_CREATE_COUNT=10] [BULK_CREATE_IGNORE_ERROR=true] arguments: <outfile> <modelA,..>`);
  }

  if (typeof outfile !== "string") {
    throw new Error(`<outfile> must be a string!`);
  }

  if (typeof models !== "string") {
    throw new Error(`<modelA,..> must be a list of model names!`);
  }

  loadConfig();

  const [BULK_CREATE_COUNT, BULK_CREATE_IGNORE_ERROR] = checkEnvVariables(["BULK_CREATE_COUNT", "BULK_CREATE_IGNORE_ERROR"], ["10", "true"]);
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
        const ret: any = {};
        const attrs = Object.keys(i);
        for (const a of attrs) {
          ret[a] = i[a] && i[a].type === "Buffer" ? Buffer.from(i[a]) : i[a];
        }
        return ret;
      });
      if (bulkCount === 0) {
        for (const m of list) {
          try {
            await db.models[modelName].create(m);
          } catch(e: any) {
            if(BULK_CREATE_IGNORE_ERROR === "true") {
              console.error("error pushing");
              console.error(e.message);
              console.error("");
            } else {
              throw e;
            }
          }
        }
      } else {
        let current;
        while ((current = list.splice(0, bulkCount)).length > 0) {
          try {
            await db.models[modelName].bulkCreate(current);
          } catch(e: any) {
            if(BULK_CREATE_IGNORE_ERROR === "true") {
              console.error("error pushing");
              console.error(e.message);
              console.error("");
            } else {
              throw e;
            }
          }
        }
      }
    }
  }
  await db.close();
}
