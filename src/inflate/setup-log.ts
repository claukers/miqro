import { Logger } from "@miqro/core";
import { ImportJSXFileOptions, importLogConfigModule, InflateError, inflateJSX } from "../common/jsx.js";
import { getLogConfigPath } from "../common/paths.js";
import { dirname, relative, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";
import { LogConfig } from "../types.js";

export interface LogConfigMap {
  [service: string]: LogConfig | undefined;
}

export async function setupLogConfig(logger: Logger, servicePath: string, service: string, logConfigMap: LogConfigMap, inflateDir: string | undefined | false, options: ImportJSXFileOptions, errors: InflateError[]) {
  const logPath = getLogConfigPath(servicePath); // resolve(process.cwd(), service, "server.ts");
  if (logPath) {
    try {
      //logger.debug("setting up server config from [%s]", join(service, basename(serverPath)));

      const logConfig = await importLogConfigModule(logPath, options, logger);
      logConfigMap[service] = logConfig;

      if (inflateDir) {
        const inflatePath = resolve(inflateDir, service, "log.cjs");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(logPath, {
          // embemedJSX: false,
          minify: false,
          useExport: true,
          platform: "node",
          logger
        }));
      }
    } catch (e) {
      errors.push({
        filePath: logPath,
        error: e
      });
      logger.error("error with " + logPath);
      logger.error(e);
    }
  }
}
