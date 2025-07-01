import { Logger, Router, SessionHandler } from "@miqro/core";
import { importAuthModule, InflateError, inflateJSX } from "../common/jsx.js";
import { getAuthConfigPath } from "../common/paths.js";
import { basename, dirname, join, relative, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";

export async function setupAUTH(logger: Logger, servicePath: string, service: string, mainRouter: Router, inflateDir: string | undefined | false, inflateSea: boolean, errors: InflateError[]) {
  const authPath = getAuthConfigPath(servicePath); //resolve(process.cwd(), service, "auth.ts");

  if (authPath) {
    try {
      const authModule = await importAuthModule(authPath, logger);
      logger.debug("setting up authentication from [%s]", join(service, basename(authPath)));
      mainRouter.use(SessionHandler(authModule));

      if (inflateDir && inflateSea) {
        const inflatePath = resolve(inflateDir, service, "auth.cjs");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(authPath, {
          // embemedJSX: false,
          minify: false,
          useExport: true,
          platform: "node",
          logger
        }));
      }

    } catch (e) {
      errors.push({
        filePath: authPath,
        error: e
      });
      logger.error("error with " + authPath);
      logger.error(e);
    }
  }
}
