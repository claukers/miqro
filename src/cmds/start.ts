import {execSync} from "../utils";
import {mainPath} from "@miqro/runner";
import {loadConfig} from "@miqro/core";

export const usage = "usage: [NODE_ENV=development] CLUSTER_COUNT=os.cpus().length [DISABLE_RESTART=true|false] npx miqro start <script> [...args]";

export const main = (): void => {

  if (process.argv.length <= 3) {
    throw new Error(`invalid number of args\n${usage}`);
  }

  loadConfig();

  execSync(`${process.argv[0]} ${mainPath()} ${process.argv.slice(3).join(" ")}`)
}

