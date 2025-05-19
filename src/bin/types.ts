import { MinimalLogger } from "@miqro/core";
import { Arguments } from "../common/arguments.js";
import { initTypes } from "../common/assets.js";
import { existsSync, writeFileSync } from "node:fs";
import { TEMPLATES } from "../../editor/common/templates.js";
import { EXIT_CODES } from "../common/constants.js";

export async function installTypings(args: Arguments, logger: MinimalLogger) {
  if (args.installTypes) {
    logger.debug("writing types");
    // install typing for typescript only if argument --install-types is set
    await initTypes(logger);
  }
  if (args.installTSConfig && !existsSync("tsconfig.json")) {
    logger.info("writing tsconfig.json");
    writeFileSync("tsconfig.json", TEMPLATES["TSCONFIGJSON"].template("", ""));
  } else if (args.installTSConfig) {
    logger.error("tsconfig.json already exists!");
    process.exit(EXIT_CODES.ABNORMAL);
  }
  if (args.installMiqroJSON && !existsSync("miqro.json")) {
    logger.info("writing miqro.json");
    writeFileSync("miqro.json", TEMPLATES["MIQROJSON"].template("", ""));
  } else if (args.installMiqroJSON) {
    logger.error("miqro.json already exists!");
    process.exit(EXIT_CODES.ABNORMAL);
  }
  process.exit(EXIT_CODES.NORMAL_EXIT);
}
