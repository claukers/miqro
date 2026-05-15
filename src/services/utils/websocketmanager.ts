import { Logger } from "@miqro/core";
import { ClusterWebSocketServer2 } from "./cluster-ws.js";
import { WSConfig } from "../../types.js";
import { LogProvider } from "./log.js";
import { EditorAdminInterface } from "../../common/admin-interface.js";

export interface WebSocketManagerOptions {
  logger?: Logger | Console;
  loggerProvider?: LogProvider;
  name?: string;
}

export class WebSocketManager {
  public runningGlobalWSMap = new Map<string, ClusterWebSocketServer2>();
  public logger?: Logger | Console | null = null;
  public adminInterface?: EditorAdminInterface;
  public name: string;
  public avoidLogSocket: boolean;
  public loggerProvider: LogProvider;
  constructor(options?: WebSocketManagerOptions) {
    this.onUpgrade = this.onUpgrade.bind(this);
    this.logger = options && options.logger ? options.logger : null;
    this.name = options && options.name ? options.name : "WebSocketManager";
    this.loggerProvider = options && options.loggerProvider;
  }

  public deleteWS(path: string) {
    const ws = this.runningGlobalWSMap.get(path);
    this.disconnectAllFrom(path);
    if (ws)
      ws.dispose();
    this.runningGlobalWSMap.delete(path);
  }

  public deleteAllWS() {
    for (const path of this.runningGlobalWSMap.keys()) {
      this.deleteWS(path);
    }
  }

  public getWS(path: string): ClusterWebSocketServer2 | undefined {
    return this.runningGlobalWSMap.get(path);
  }

  public replaceALLWS(list: WSConfig[]) {
    this.deleteAllWS();
    for (const wsConfig of list) {
      if (!wsConfig.disabled) {
        if (this.runningGlobalWSMap.has(wsConfig.path)) {
          throw new Error(`ws on path ${wsConfig.path} already setup!`);
        }
        this.logger?.debug("setting up websocket on [%s]", wsConfig.path);
        const identifier = wsConfig.path.replaceAll("/", "_").toUpperCase();
        const logger = this.loggerProvider && identifier.length >= 0 ? this.loggerProvider.getLogger(identifier.substring(identifier.charAt(0) === "_" ? 1 : 0)) : this.logger;
        const server = new ClusterWebSocketServer2(this.name + wsConfig.path, wsConfig.path, logger, wsConfig);
        this.runningGlobalWSMap.set(wsConfig.path, server);
      }
    }
  }

  public replaceALLWSBuLOGSocket(list: WSConfig[]) {
    for (const path of this.runningGlobalWSMap.keys()) {
      this.deleteWS(path);
    }
    for (const wsConfig of list) {
      if (!wsConfig.disabled) {
        if (this.runningGlobalWSMap.has(wsConfig.path)) {
          throw new Error(`ws on path ${wsConfig.path} already setup!`);
        }
        this.logger?.debug("setting up websocket on [%s]", wsConfig.path);
        const identifier = wsConfig.path.replaceAll("/", "_").toUpperCase();
        const logger = this.loggerProvider && identifier.length >= 0 ? this.loggerProvider.getLogger(identifier.substring(identifier.charAt(0) === "_" ? 1 : 0)) : this.logger;
        const server = new ClusterWebSocketServer2(this.name + wsConfig.path, wsConfig.path, logger, wsConfig);
        this.runningGlobalWSMap.set(wsConfig.path, server);
      }
    }
  }

  /*public setupWS(path: string, server: ClusterWebSocketServer2) {
    if (this.runningGlobalWSMap.has(path)) {
      throw new Error(`ws on path ${path} already setup!`);
    }
    this.runningGlobalWSMap.set(path, server);
  }*/

  public disconnectAllFrom(path: string) {
    try {
      this.logger?.debug("disconnect all from [%s]", path);
      const ws = this.getWS(path);
      if (ws) {
        const clients = ws.clients.values();
        if (clients) {
          for (const client of clients) {
            try {
              client.socket.destroy();
            } catch (e2) {
              this.logger?.error("error disconnecting web socket client");
              this.logger?.error(e2);
            }
          }
        }
        //ws.dispose();
      }
    } catch (e) {
      this.logger?.error("error disconnecting web socket clients");
      this.logger?.error(e.message);
    }
  }

  public disconnectAllButLOGSocket() {
    try {
      for (const wsPath of this.runningGlobalWSMap.keys()) {
        this.disconnectAllFrom(wsPath);
      }
    } catch (e) {
      this.logger?.error("error disconnecting web socket clients");
      this.logger?.error(e.message);
    }
  }

  public disconnectAll() {
    try {
      for (const wsPath of this.runningGlobalWSMap.keys()) {
        this.disconnectAllFrom(wsPath);
      }
    } catch (e) {
      this.logger?.error("error disconnecting web socket clients");
      this.logger?.error(e.message);
    }
  }

  public onUpgrade(req, socket, head) {
    try {
      const wsServer = this.getWS(req.path);
      if (wsServer) {
        req.editor = this.adminInterface;
        const ret = wsServer.onUpgrade(req, socket, head);
        delete req.editor;
        return ret;
      } else {
        socket.destroy();
      }
    } catch (e) {
      delete req.editor;
      this.logger?.error(e);
    }
  }
}

/*export interface WSMapConfig {
  [path: string]: {
    name: string;
    options: WSConfig;
  } | undefined;
}*/
