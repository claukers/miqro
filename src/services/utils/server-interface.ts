import { WebSocketServer, Logger } from "@miqro/core";
import { Database } from "@miqro/query";
import cluster from "node:cluster";
import { CacheInterface, MigrateOptions, NamedMigration, ServerInterface } from "../../types.js";
import { DBManager } from "./db-manager.js";
import { Miqro } from "../app.js";
import { WebSocketManager } from "./websocketmanager.js";
import { execSync } from "node:child_process";
import { LogProvider } from "./log.js";

/*
{
      cache: this.cache,
      localCache: this.localCache,
      db: {
        get: (name: string) => {
          return this.dbManager.getDB(name);
        },
        getMigrations: () => {
          if (this.inflated) {
            const ret: NamedMigration[] = [];
            for (const d of this.inflated.dbList) {
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
        migrate: (options) => {
          return this.migrate(options);
        },
      },
      ws: {
        get: (path: string) => {
          if (path === LOG_SOCKET_PATH) {
            throw new Error("cannot use this path");
          }
          return this.webSocketManager.getWS(path);
        },
        disconnectAll: (path: string) => {
          if (path === LOG_SOCKET_PATH) {
            throw new Error("cannot use this path");
          }
          this.webSocketManager.disconnectAllFrom(path);
        }
      },
      isPrimaryWorker: () => {
        return cluster.isPrimary || process.env["CLUSTER_NODE_NUMBER"] === "0";
      },
      openBrowser: (path: string) => {
        const PORT = this.options.port;
        const URL = `http://localhost:${PORT}${path}`;
        const DEFAULT_OPEN = process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open";
        const OPEN = process.env["BROWSER"] ? process.env["BROWSER"] === "none" ? false : process.env["BROWSER"] : DEFAULT_OPEN;
        if (OPEN) {
          const openCMD = `${OPEN} "${URL}"`;
          this.logger?.info("opening browser with [%s]", openCMD);
          execSync(openCMD);
        } else {
          this.logger?.warn("ignoring browser [%s]", process.env["BROWSER"]);
        }
      },
      logger: this.logger,
      getLogger: (identifier: string, options?: { level?: any; transports?: any[]; formatter?: any; }) => {
        return this.loggerProvider.getLogger(identifier, options);
      }
    }*/

export interface ServerInterfaceImplOptions {
  cache: CacheInterface;
  localCache: CacheInterface;
  dbManager: DBManager;
  wsManager: WebSocketManager;
  logger?: Logger;
  app?: Miqro;
  port?: string;
  loggerProvider?: LogProvider;
}

export class ServerInterfaceImpl implements ServerInterface {
  public cache: CacheInterface;
  public localCache: CacheInterface;
  public logger?: Logger;
  public port?: string;

  public db: {
    get(name: string): Database | null;
    getMigrations(): NamedMigration[];
    migrate(options: MigrateOptions): Promise<void>;
  };
  public ws: {
    get(path: string): WebSocketServer | undefined;
    disconnectAll(path: string): void;
  };
  public loggerProvider?: LogProvider;

  constructor(options: ServerInterfaceImplOptions) {
    this.cache = options.cache;
    this.localCache = options.localCache;
    this.logger = options.logger;
    this.port = options.port;

    const dbManager = options.dbManager;
    const wsManager = options.wsManager;
    this.loggerProvider = options.loggerProvider;
    const app = options.app;

    this.db = Object.freeze({
      get: (name: string) => {
        return dbManager.getDB(name);
      },
      getMigrations: () => {
        if (app?.inflated) {
          const ret: NamedMigration[] = [];
          for (const d of app?.inflated.dbList) {
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
      migrate: (options: MigrateOptions) => {
        return app?.migrate(options);
      }
    });
    this.ws = Object.freeze({
      get: (name: string) => {
        return wsManager?.getWS(name);
      },
      disconnectAll: (path: string) => {
        return wsManager?.disconnectAllButLOGSocket();
      }
    });
  }
  public isPrimaryWorker(): boolean {
    return cluster.isPrimary || process.env["CLUSTER_NODE_NUMBER"] === "0";
  }
  public openBrowser(path: string): void {
    const PORT = this.port;
    const URL = `http://localhost${PORT ? `:${PORT}` : ""}${path}`;
    const DEFAULT_OPEN = process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open";
    const OPEN = process.env["BROWSER"] ? process.env["BROWSER"] === "none" ? false : process.env["BROWSER"] : DEFAULT_OPEN;
    if (OPEN) {
      const openCMD = `${OPEN} "${URL}"`;
      this.logger?.info("opening browser with [%s]", openCMD);
      execSync(openCMD);
    } else {
      this.logger?.warn("ignoring browser [%s]", process.env["BROWSER"]);
    }
  }
  public getLogger(identifier: string, options?: { level?: any; transports?: any[]; formatter?: any; }): Logger {
    return this.loggerProvider?.getLogger(identifier, options);
  }
}
