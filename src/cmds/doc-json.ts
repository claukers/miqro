import { getLogger, loadConfig } from "@miqro/core";
import { getDOCJSON } from "../utils/doc";

export const usage = `usage: [NODE_ENV=development] npx miqro doc <api_folder> <subPath> [apiName]`;

export const main = (): void => {

  if (process.argv.length < 5 || process.argv.length > 6) {
    throw new Error(usage);
  }

  const dirname = process.argv[3];
  const subPath = process.argv[4];
  const apiName = process.argv[5];

  loadConfig();

  console.log(JSON.stringify(getDOCJSON({ dirname, subPath, apiName }, getLogger("miqro")), undefined, 2));
}
