import { mkdirSync, writeFileSync } from "node:fs";
import { importCORSModule, InflateError, inflateJSX } from "../common/jsx.js";
import { getCORSConfigPath } from "../common/paths.js";
import { CORS, Logger, Router } from "@miqro/core";
import { basename, dirname, join, relative, resolve } from "node:path";
import { cwd } from "node:process";

export async function setupCORS(logger: Logger, servicePath: string, service: string, mainRouter: Router, inflateDir: string | undefined | false, inflateSea: boolean, errors: InflateError[]) {
  const corsPath = getCORSConfigPath(servicePath);

  if (corsPath) {
    try {
      const corsOptions = await importCORSModule(corsPath, logger);
      logger.debug("setting up cors from [%s]", join(service, basename(corsPath)));
      mainRouter.use(CORS(corsOptions));

      if (inflateDir && inflateSea) {
        const inflatePath = resolve(inflateDir, service, "cors.js");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(corsPath, {
          embemedJSX: false,
          minify: false,
          useExport: true,
          logger
        }));
      }

    } catch (e) {
      errors.push({
        filePath: corsPath,
        error: e
      });
      logger.error("error with " + corsPath);
      logger.error(e);
    }
  }
}
