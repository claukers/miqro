import { mkdirSync, writeFileSync } from "node:fs";
import { importCORSModule, ImportJSXFileOptions, InflateError, inflateJSX } from "../common/jsx.js";
import { getCORSConfigPath } from "../common/paths.js";
import { CORS, Logger, Router } from "@miqro/core";
import { basename, dirname, join, relative, resolve } from "node:path";
import { cwd } from "node:process";

export async function setupCORS(logger: Logger, servicePath: string, service: string, mainRouter: Router, inflateDir: string | undefined | false, inflateSea: boolean, options: ImportJSXFileOptions, errors: InflateError[]) {
  const corsPath = getCORSConfigPath(servicePath);

  if (corsPath) {
    try {
      logger.debug("setting up cors from [%s]", join(service, basename(corsPath)));
      const corsOptions = await importCORSModule(corsPath, options, logger);

      mainRouter.use(CORS(corsOptions));

      if (inflateDir && inflateSea) {
        const inflatePath = resolve(inflateDir, service, "cors.cjs");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(corsPath, {
          // embemedJSX: false,
          minify: false,
          useExport: true,
          platform: "node",
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
