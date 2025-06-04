import { WebSocketServer, Logger } from "@miqro/core";
import { Database } from "@miqro/query";
import cluster from "node:cluster";
import { CacheInterface, MigrateOptions, NamedMigration, ServerInterface } from "../../types.js";
import { DBManager } from "./db-manager.js";
import { Miqro } from "../app.js";
import { WebSocketManager } from "./websocketmanager.js";
import { execSync } from "node:child_process";
import { LogProvider } from "./log.js";
import { initGlobals } from "../globals.js";

export interface ServerInterfaceImplOptions {
  cache: CacheInterface;
  localCache: CacheInterface;
  dbManager: DBManager;
  webSocketManager: WebSocketManager;
  logger?: Logger;
  app?: Miqro;
  port?: string;
  loggerProvider?: LogProvider;
}

export function createServerInterface(options: ServerInterfaceImplOptions): ServerInterface {
  initGlobals();
  return Object.freeze<ServerInterface>({
    cache: options.cache,
    localCache: options.localCache,
    logger: options.logger,
    reload() {
      return options?.app?.reload();
    },
    restart() {
      return options?.app?.restart();
    },
    stop() {
      return options?.app?.stop();
    },
    db: {
      get(name) {
        return options.dbManager.getDB(name);
      },
      getMigrations() {
        if (options.app?.inflated) {
          const ret: NamedMigration[] = [];
          for (const d of options.app?.inflated.dbList) {
            ret.push(...(d.migrations.map(m => {
              return {
                name: m.name,
                service: m.service,
                dbName: m.dbName
              }
            })));
          }
          return ret;
        }
        return [];
      },
      migrate(migrateOptions) {
        return options?.app?.migrate(migrateOptions);
      },
    },
    ws: {
      get: (name: string) => {
        return options?.webSocketManager?.getWS(name);
      },
      disconnectAll: (path: string) => {
        return options?.webSocketManager?.disconnectAllButLOGSocket();
      }
    },
    openBrowser(path) {
      const PORT = options.port;
      const URL = `http://localhost${PORT ? `:${PORT}` : ""}${path}`;
      const DEFAULT_OPEN = process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open";
      const OPEN = options?.app?.options.browser !== undefined && String(options?.app?.options.browser).toUpperCase() !== "TRUE" && String(options?.app?.options.browser).toUpperCase() !== "1" ?
        String(options?.app.options.browser).toUpperCase() !== "0" && String(options?.app?.options.browser).toUpperCase() !== "FALSE" && String(options?.app?.options.browser).toUpperCase() !== "NONE" && options?.app?.options.browser ?
          options?.app.options.browser : false :
        process.env["BROWSER"] ?
          process.env["BROWSER"] === "none" ? false : process.env["BROWSER"] : DEFAULT_OPEN;
      if (OPEN) {
        const openCMD = `${OPEN} "${URL}"`;
        options?.logger?.info("opening browser with [%s]", openCMD);
        execSync(openCMD);
      } else {
        options?.logger?.warn("ignoring browser [%s]", OPEN);
      }
    },
    getLogger(identifier, loggerOptions) {
      return options?.loggerProvider?.getLogger(identifier, loggerOptions);
    },
    ...server
  });
}
