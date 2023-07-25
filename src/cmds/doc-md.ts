import { getLogger, loadConfig } from "@miqro/core";
import { getMDDoc } from "../utils/doc/md";

export const usage = `usage: [NODE_ENV=development] npx miqro doc <api_folder> <subPath> [apiName]`;

export const main = async (): Promise<void> => {

  if (process.argv.length < 5 || process.argv.length > 6) {
    throw new Error(usage);
  }

  const dirname = process.argv[3];
  const subPath = process.argv[4];
  const apiName = process.argv[5];

  loadConfig();

  console.log(await getMDDoc({ dirname, subPath, apiName }));
}
