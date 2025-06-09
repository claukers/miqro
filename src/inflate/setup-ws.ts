import { Logger } from "@miqro/core";
import { dirname, join, relative, resolve } from "node:path";
import { cwd } from "node:process";
import { mkdirSync, writeFileSync } from "node:fs";

import { importWSConfigModule, InflateError, inflateJSX } from "../common/jsx.js";
import { getWSConfigPath } from "../common/paths.js";
import { WSConfig } from "../types.js";

export async function inflateWSConfig(logger: Logger, servicePath: string, service: string, wsConfigList: WSConfig[] | undefined, inflateDir: string | undefined | false, errors: InflateError[]): Promise<void> {
  const wsPath = getWSConfigPath(servicePath); // resolve(process.cwd(), service, "ws.ts");

  if (wsPath) {
    try {
      logger.debug("importing websocket socket for service [%s]", service);
      const wsConfig = await importWSConfigModule(wsPath, logger);
      if (wsConfig && wsConfigList.filter(c => c.path === wsConfig.path).length > 0) {
        throw new Error(`ws path [${wsConfig.path}] already defined! from [${wsPath}]`);
      } else if (wsConfigList) {
        logger.debug("importing websocket on path [%s] from [%s]", wsConfig.path, join(service, "ws.ts"));
        wsConfigList.push(wsConfig);
        //wsMap[wsConfig.path] = { name: service, options: wsConfig };
      }

      if (inflateDir) {
        const inflatePath = resolve(inflateDir, service, "ws.cjs");
        mkdirSync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        writeFileSync(inflatePath, await inflateJSX(wsPath, {
          embemedJSX: false,
          minify: false,
          platform: "node",
          useExport: true,
          logger
        }));
      }
      //return wsConfigList;
    } catch (e) {
      errors.push({
        filePath: wsPath,
        error: e
      });
      logger.error("error with " + wsPath);
      logger.error(e);
      //return false;
    }
  }
}
