import { getLogger, loadConfig } from "@miqro/core";
import { getDOCJSON } from "../utils/doc";

export const usage = `usage: [NODE_ENV=development] npx miqro doc <api_folder> <subPath>`;

export const main = (): void => {

  if (process.argv.length !== 5) {
    throw new Error(usage);
  }

  const dirname = process.argv[3];
  const subPath = process.argv[4];

  loadConfig();

  console.log(JSON.stringify(getDOCJSON({ dirname, subPath }, getLogger("miqro")), undefined, 2));
}
