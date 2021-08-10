import { getLogger, loadConfig } from "@miqro/core";
import { getDOCJSON } from "../util";

export const main = (): void => {

  if (process.argv.length !== 5) {
    throw new Error(`arguments: <api_folder> <subPath>`);
  }

  const dirname = process.argv[3];
  const subPath = process.argv[4];

  loadConfig();

  console.log(JSON.stringify(getDOCJSON({ dirname, subPath }, getLogger("miqro")), undefined, 2));
}
