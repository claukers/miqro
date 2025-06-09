import { mkdirSync, writeFileSync } from "node:fs";
import { Logger } from "@miqro/core";
import { dirname, relative, resolve } from "node:path";
import { cwd } from "node:process";

import { importServerConfigModule, InflateError, inflateJSX } from "../common/jsx.js";
import { getServerConfigPath } from "../common/paths.js";
import { ServerConfig } from "../types.js";

export interface ServerConfigMap {
  [service: string]: ServerConfig | undefined;
}

export async function setupServerConfig(logger: Logger, servicePath: string, service: string, serverConfigMap: ServerConfigMap, inflateDir: string | undefined | false, errors: InflateError[]) {

  const serverPath = getServerConfigPath(servicePath); // resolve(process.cwd(), service, "server.ts");
  if (serverPath) {
    try {
      //logger.debug("setting up server config from [%s]", join(service, basename(serverPath)));
      
      const serverConfig = await importServerConfigModule(serverPath, logger);
      serverConfigMap[service] = serverConfig;


      if (inflateDir) {
        const inflatePath = resolve(inflateDir, service, "server.cjs");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(serverPath, {
          embemedJSX: false,
          minify: false,
          platform: "node",
          useExport: true,
          logger
        }));
      }
    } catch (e) {
      errors.push({
        filePath: serverPath,
        error: e
      });
      logger.error("error with " + serverPath);
      logger.error(e);
    }
  }
}
