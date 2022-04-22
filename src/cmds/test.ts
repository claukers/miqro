import {execSync} from "../utils";
import {mainPath} from "@miqro/test";
import {loadConfig} from "@miqro/core";

export const usage = "usage: npx miqro test <test_files> [-r <folder>] [-i] [-n testname]";

export const main = (): void => {

  if (process.argv.length <= 3) {
    throw new Error(`invalid number of args\n${usage}`);
  }

  loadConfig();

  execSync(`${process.argv[0]} ${mainPath()} ${process.argv.slice(3).join(" ")}`)
}

