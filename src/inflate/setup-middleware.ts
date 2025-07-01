import { Logger, Router } from "@miqro/core";
import { importMiddlewareConfigModule, InflateError, inflateJSX } from "../common/jsx.js";
import { getMiddlewareConfigPath } from "../common/paths.js";
import { basename, dirname, join, relative, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";
import { MiddlewareConfig } from "../types.js";

export async function setupMiddleware(logger: Logger, servicePath: string, service: string, mainRouter: Router, inflateDir: string | undefined | false, inflateSea: boolean, errors: InflateError[]): Promise<MiddlewareConfig | null> {
  const middlewarePath = getMiddlewareConfigPath(servicePath); //resolve(process.cwd(), service, "auth.ts");

  if (middlewarePath) {
    try {
      const middewareModule = await importMiddlewareConfigModule(middlewarePath, logger);
      logger.debug("setting up middleware from [%s]", join(service, basename(middlewarePath)));
      if (middewareModule && middewareModule.middleware) {
        for (const m of middewareModule.middleware) {
          mainRouter.use(m);
        }
      }
      if (inflateDir && inflateSea) {
        const inflatePath = resolve(inflateDir, service, "middleware.cjs");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(middlewarePath, {
          // embemedJSX: false,
          minify: false,
          platform: "node",
          useExport: true,
          logger
        }));
      }
      return middewareModule;

    } catch (e) {
      errors.push({
        filePath: middlewarePath,
        error: e
      });
      logger.error("error with " + middlewarePath);
      logger.error(e);
    }
  }
  return null;
}
