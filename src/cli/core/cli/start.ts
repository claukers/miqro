import { loadConfig } from "@miqro/core";
import { execSync } from "../../utils";
import { mainPath } from "@miqro/runner";

export const main = (): void => {

  if (process.argv.length <= 3) {
    throw new Error(`invalid number of args`);
  }

  loadConfig();

  //execSync(`npx @miqro/runner ${process.argv.slice(3).join(" ")}`);
  execSync(`${process.argv[0]} ${mainPath()} ${process.argv.slice(3).join(" ")}`)
}

