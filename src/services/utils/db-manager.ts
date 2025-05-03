import cluster from "node:cluster";
import { Database } from "@miqro/query";
import { DBConfig } from "../../types.js";
import { LogProvider } from "./log.js";
import { Logger } from "@miqro/core";

export class DBManager {
  private map = new Map<string, Database>();
  public options: {
    loggerProvider?: LogProvider;
    logger?: Logger;
  };

  constructor(options?: {
    loggerProvider?: LogProvider;
    logger?: Logger;
  }) {
    this.options = options ? options : {};
  }

  async setupDB(config: DBConfig) {
    if (this.getDB(config.name)) {
      throw new Error("cannot override db");
    }
    if (!config.disabled) {
      const DB_IDENTIFIER = cluster.isPrimary ? "DATABASE" : process.env["CLUSTER_NODE_NUMBER"] ? `WORKER_${process.env["CLUSTER_NODE_NUMBER"]}_DATABASE` : "WORKER_DATABASE";
      this.options?.logger?.debug("setting up db connection [%s]", config.name);
      this.options?.logger?.trace("creating db connection [%s]", config.name);
      const db = new Database({
        dialect: config.dialect ? config.dialect as any : "node:sqlite",
        storage: config.storage ? config.storage : "./db.sqlite3",
        connectionString: config.url,
        logger: this.options?.loggerProvider?.getLogger(`${DB_IDENTIFIER}_${config.name}`)
      });

      this.options?.logger?.trace("connecting db connection [%s]", config.name);
      await db.connect();
      this.options?.logger?.trace("db connection [%s] connected", config.name);

      /*if (config.name && config.name !== name) {
        this.setDB(config.name, db);
      }*/

      this.setDB(config.name, db);

      return db;
    }
  }

  async closeAll() {
    this.options?.logger?.debug("closing all db connections");
    for (const name of this.map.keys()) {
      const db = this.map.get(name);
      if (db && db.status === "connected") {
        this.options?.logger?.debug("disconnecting db connection [%s]", name);
        await db.disconnect();
      }
    }
  }

  async deleteAll() {
    await this.closeAll();
    this.options?.logger?.debug("clear all db connections");
    this.map.clear();
  }

  getDB(name: string): Database | null {
    const db = this.map.get(name);
    return db ? db : null;
  }

  setDB(name: string, db: Database): void {
    if (this.getDB(name)) {
      throw new Error("cannot override db connection [" + name + "]");
    }
    this.map.set(name, db);
  }

}
