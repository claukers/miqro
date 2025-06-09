import { Logger, Router } from "@miqro/core";
import { importErrorConfigModule, InflateError, inflateJSX } from "../common/jsx.js";
import { getErrorConfigPath } from "../common/paths.js";
import { basename, dirname, join, relative, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";

export async function setupError(logger: Logger, servicePath: string, service: string, mainRouter: Router, inflateDir: string | undefined | false, inflateSea: boolean, errors: InflateError[]): Promise<void> {
  const errorPath = getErrorConfigPath(servicePath); //resolve(process.cwd(), service, "auth.ts");

  if (errorPath) {
    try {
      const errorModule = await importErrorConfigModule(errorPath, logger);
      logger.debug("setting up error handling from [%s]", join(service, basename(errorPath)));
      if (errorModule && errorModule.catch) {
        for (const m of errorModule.catch) {
          mainRouter.catch(m);
        }
      }
      if (inflateDir && inflateSea) {
        const inflatePath = resolve(inflateDir, service, "catch.cjs");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(errorPath, {
          embemedJSX: false,
          minify: false,
          useExport: true,
          platform: "node",
          logger
        }));
      }

    } catch (e) {
      errors.push({
        filePath: errorPath,
        error: e
      });
      logger.error("error with " + errorPath);
      logger.error(e);
    }
  }
}
