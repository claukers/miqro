import cluster from "node:cluster";
import { App, Router, Logger, LoggerHandler, LogLevel } from "@miqro/core";
import { migration } from "@miqro/query";
import { WebSocketManager } from "./utils/websocketmanager.js";
import { DBManager } from "./utils/db-manager.js";
import { inflateApp } from "../inflate/inflate.js";
import { ImportJSXFileOptions, InflateError } from "../common/jsx.js";
import { DBConfig, MigrateOptions, ServerInterface, ServerRequest, ServerResponse, WSConfig } from "../types.js";
import { RouteFileMap } from "../inflate/setup-http.js";
import { ServerConfigMap, setupServerConfig } from "../inflate/setup-server-config.js";
import { BASEEDITOR_PATH, LOG_SOCKET_PATH, LOG_WRITE_EVENT } from "../../editor/common/constants.js";
import editorWSConfig from "../../editor/ws.js";
import editorServerConfig from "../../editor/server.js";

import { ClusterCache } from "./utils/cluster-cache.js";
import { createEditorRouter } from "./editor.js";
import { EDITOR_CONFIG_KEY, HOT_RELOAD_PATH, HOT_RELOAD_SCRIPT_PATH } from "../common/constants.js";
import { watchAndServer } from "../common/watch.js";
import { LocalCache } from "./utils/cache.js";
// import { initGlobals } from "./globals.js";
import { EditorAdminInterface } from "../common/admin-interface.js";
import { LogProvider, LogProviderOptions } from "./utils/log.js";
import { initAssets } from "../common/assets.js";
import { setupExitHandlers } from "../common/exit.js";
import { inflateDBConfig, inflateDBMigrations, MigrationModule } from "../inflate/setup-db.js";
import { getServicePath } from "../common/paths.js";
import { LogConfigMap } from "../inflate/setup-log.js";
import { createServerInterface } from "./utils/server-interface.js";
import { getPORT, importMiqroJSON } from "../common/arguments.js";
import { createLogProviderOptions } from "./utils/log-transport.js";
import { createAdminInterface } from "./utils/admin-interface.js";
import { dirname, join, relative, resolve } from "node:path";
import { cwd } from "node:process";
import { ServerOptions } from "node:https";
import { HOT_RELOAD_JS_SCRIPT } from "./hot-reload.js";

export interface MiqroOptions extends ImportJSXFileOptions {
  name: string;
  logger?: Logger;
  logProviderOptions?: LogProviderOptions;
  services: string[];
  editor: boolean;
  port: string;
  browser?: string | boolean;
  logFile?: string | boolean;
  hotreload?: boolean;
  watch?: boolean;
  serverOptions?: ServerOptions<any, any>;
  etag?: boolean;
  https?: boolean;
  httpRedirect?: number;
  noMinify?: boolean;
  allowedRedirectHosts?: string[];
}

export interface InflateOptions {
  inflateDir?: string;
  inflateSea?: boolean;
  inflateOnlyAssets?: boolean;
  inflateParallel?: number;
  inflateFlat?: boolean;
}

export interface InflatedResult {
  router: Router;
  errors: InflateError[];
  fileMap: RouteFileMap;
  dbList: {
    dbConfig: DBConfig;
    service: string;
    migrations: MigrationModule[];
  }[];
  wsConfigList: WSConfig[];
  serverConfigMap: ServerConfigMap;
  logConfigMap: LogConfigMap;
}

export const MiqroApplicationMessageType = "$$$MiqroApplicationMessageType$$$";

export interface MiqroClusterMessage {
  type: typeof MiqroApplicationMessageType;
  action: "reload" | "restart";
  target: string;
  fromPID: number;
}

export class Miqro {
  public status: "stopped" | "starting" | "stopping" | "reloading" | "started" = "stopped";
  public options: MiqroOptions;
  public server?: App | null = null;
  public httpsRedirectServer?: App | null = null;
  public cache: ClusterCache;
  public localCache: LocalCache;
  public webSocketManager: WebSocketManager;
  public dbManager: DBManager;

  public serverInterface: ServerInterface;
  public adminInterface: EditorAdminInterface;

  public inflated: InflatedResult | null | undefined = null;
  private listener: (msg: MiqroClusterMessage) => void;
  public serverRequestHandler: (req: ServerRequest) => void;
  public logger?: Logger;
  public loggerProvider: LogProvider;
  public static initAssetsPromise: Promise<any> | null = null;
  public watcher?: { stopWatch: () => void; };

  constructor(options?: Partial<MiqroOptions>) {
    this.options = {
      noMinify: false,
      etag: true,
      editor: false,
      name: "server",
      noBuild: false,
      port: getPORT(),
      services: [],
      ...(options ? options : {})
    };

    const loggerOptions = createLogProviderOptions(this);
    loggerOptions.transports.push(createEditorLoggerTransport(this));
    this.loggerProvider = new LogProvider(loggerOptions);

    //if (!this.options.logger) {
    const SERVER_IDENTIFIER = cluster.isPrimary ?
      "" :
      process.env["CLUSTER_NODE_NUMBER"] ?
        `WORKER_${process.env["CLUSTER_NODE_NUMBER"]}`.toUpperCase() :
        `WORKER`;
    this.logger = this.options.logger ? this.options.logger : this.loggerProvider.getLogger(SERVER_IDENTIFIER);
    //}
    this.listener = async (data: any) => {
      try {
        const msg = (data as MiqroClusterMessage);
        if (
          msg &&
          msg.action &&
          msg.type === MiqroApplicationMessageType &&
          msg.target === this.options.name &&
          msg.fromPID !== process.pid &&
          (msg.action === "reload" || msg.action === "restart")) {
          this.logger?.debug("remote server message from [%s] [%s]", msg.fromPID, msg.action);
          switch (msg.action) {
            case "reload":
              await this.reload(true);
              break;
            case "restart":
              await this.restart(true);
              break;
            default:
              throw new Error("unsupported message for ApplicationServer");
          }
        }
      } catch (e) {
        this.logger?.error(e);
      }
    };
    this.cache = new ClusterCache(`MiqroApplicationCache[${this.options.name}]`, this.logger);
    this.localCache = new LocalCache(`MiqroApplicationLocalCache[${this.options.name}]`, this.logger);
    this.webSocketManager = new WebSocketManager({
      logger: this.logger,
      loggerProvider: this.loggerProvider,
      name: `MiqroApplicationWebsocketManager[${this.options.name}]`,
      avoidLogSocket: this.options.editor
    });
    this.listener = this.listener.bind(this);
    //this.requestLoggerFactory = this.requestLoggerFactory.bind(this);
    //this.loggerFactory = this.loggerFactory.bind(this);
    this.dbManager = new DBManager({
      loggerProvider: this.loggerProvider,
      logger: this.logger
    });

    this.serverInterface = createServerInterface({
      cache: this.cache,
      dbManager: this.dbManager,
      localCache: this.localCache,
      webSocketManager: this.webSocketManager,
      app: this,
      logger: this.logger,
      loggerProvider: this.loggerProvider,
      port: this.options.port
    });

    this.serverRequestHandler = ServerRequestHandler(this.serverInterface);

    this.adminInterface = createAdminInterface(this);

    this.webSocketManager.adminInterface = this.adminInterface;

    setupExitHandlers(this);
  }

  public static async import(inFile: string, options?: Partial<MiqroOptions>, inflate?: Partial<InflateOptions>): Promise<Miqro> {
    const miqroJSON = importMiqroJSON(resolve(inFile));
    const miqroJSONDir = dirname(resolve(inFile));
    const app = new Miqro({
      name: miqroJSON.name ? miqroJSON.name : undefined,
      port: miqroJSON.port ? String(miqroJSON.port) : undefined,
      services: miqroJSON.services ? miqroJSON.services.map(s => join(relative(cwd(), miqroJSONDir), s)) : undefined,
      noBuild: miqroJSON.noBuild !== undefined ? miqroJSON.noBuild : false,
      ...(options ? options : {}),
    });
    await app.inflate({
      inflateDir: miqroJSON.inflateDir ? String(miqroJSON.inflateDir) : undefined,
      inflateParallel: miqroJSON.inflateParallel ? miqroJSON.inflateParallel : undefined,
      ...(inflate ? inflate : {}),
    });
    return app;
  }

  public connect() {
    if (process.send) {
      process.removeListener("message", this.listener);
      process.on("message", this.listener);
    }
    this.cache.connect();
    (this.adminInterface?.getCache() as ClusterCache)?.connect();
  }

  public disconnect() {
    if (this.server !== null) {
      throw new Error("already running! call stop() first");
    }
    if (process.send) {
      process.removeListener("message", this.listener);
    }
    this.cache.disconnect();
    (this.adminInterface?.getCache() as ClusterCache)?.disconnect();
    this.webSocketManager.disconnectAll();
    this.dbManager.closeAll();
  }

  public async inflateWith(inflated?: Partial<InflatedResult>) {
    if (this.inflated !== null) {
      throw new Error("already inflated! call deflate()");
    }
    // initGlobals();
    // block others from inflating while inflateApp is running
    this.inflated = undefined;
    this.inflated = {
      router: inflated && inflated.router ? inflated.router : new Router(),
      errors: inflated && inflated.errors ? inflated.errors : [],
      fileMap: inflated && inflated.fileMap ? inflated.fileMap : {},
      logConfigMap: inflated && inflated.logConfigMap ? inflated.logConfigMap : {},
      //migrations: inflated && inflated.migrations ? inflated.migrations : [],
      dbList: inflated && inflated.dbList ? inflated.dbList : [],
      wsConfigList: inflated && inflated.wsConfigList ? inflated.wsConfigList : [],
      serverConfigMap: inflated && inflated.serverConfigMap ? inflated.serverConfigMap : {}
    };
    await Promise.all(this.inflated.dbList.map(db => this.dbManager.setupDB(db.dbConfig)));
  }

  public async loadServerConfig(options?: InflateOptions) {
    const serverConfigMap: ServerConfigMap = {};
    const errors: InflateError[] = [];
    for (const service of this.options.services) {
      const servicePath = getServicePath(service);
      await setupServerConfig(this.logger, servicePath, service, serverConfigMap, options && options.inflateSea ? options.inflateDir : undefined, errors, this.options);
    }
    return {
      serverConfigMap,
      errors
    }
  }

  public async loadDBConfig(options?: InflateOptions): Promise<{
    dbList: {
      dbConfig: DBConfig;
      service: string;
      migrations: MigrationModule[];
    }[]; errors: InflateError[]
  }> {
    const errors: InflateError[] = [];
    const dbList: {
      service: string;
      dbConfig: DBConfig;
      migrations: MigrationModule[];
    }[] = [];
    const dbConfigListALL: DBConfig[] = [];
    for (const service of this.options.services) {
      const dbConfig = await inflateDBConfig(this.logger, service, dbConfigListALL, options?.inflateSea ? options?.inflateDir : undefined, this.options, errors);
      if (dbConfig) {
        const migrations = await inflateDBMigrations(this.logger, service, dbConfig.name, options?.inflateSea ? options?.inflateDir : undefined, this.options, errors);
        dbList.push({
          service,
          dbConfig,
          migrations: migrations ? migrations : []
        });
      }
    }
    return { dbList, errors };
  }

  public async migrate({ direction, service, name, dbName }: MigrateOptions = { direction: "up" }) {
    // init assets only once for all ApplicationServer's
    if (Miqro.initAssetsPromise === null) {
      // init globals only once for all inflations
      // initGlobals();
      Miqro.initAssetsPromise = initAssets(this.logger);
    }
    await Miqro.initAssetsPromise;
    const { dbList } = await this.loadDBConfig();

    for (const serviceDB of dbList) {
      if ((!service || serviceDB.service === service) && (!dbName || serviceDB.dbConfig.name === dbName)) {
        const db = this.dbManager.getDB(serviceDB.dbConfig.name) ? this.dbManager.getDB(serviceDB.dbConfig.name) : await this.dbManager.setupDB(serviceDB.dbConfig);
        if (db) {
          this.logger.info("\t\t====== [init migration table] ======");
          await migration.init(db, this.logger);
          const migrations = direction === "down" ? serviceDB.migrations.reverse() : serviceDB.migrations;
          if (!name) {
            for (const m of migrations) {
              if (direction === "down") {
                await migration.down.module(db, m.name, m, this.logger);
              } else {
                await migration.up.module(db, m.name, m, this.logger);
              }
            }
          } else {
            for (const m of migrations) {
              if (m.name === name) {
                if (direction === "down") {
                  await migration.down.module(db, m.name, m, this.logger);
                } else {
                  await migration.up.module(db, m.name, m, this.logger);
                }
                break;
              }
            }
          }
        }
      }
    }
  }

  public async inflate(options?: InflateOptions): Promise<InflatedResult> {
    if (this.inflated !== null) {
      throw new Error("already inflated! call await deflate() first!");
    }
    try {
      // block others from inflating while inflateApp is running
      this.inflated = undefined;
      // init assets only once for all ApplicationServer's
      if (Miqro.initAssetsPromise === null && (this.options.noBuild === false || this.options.noMinify === false)) {
        // init globals only once for all inflations
        // initGlobals();
        Miqro.initAssetsPromise = initAssets(this.logger);
      }
      await Miqro.initAssetsPromise;

      // store the result
      const router = new Router();
      const wsConfigList: WSConfig[] = [];

      /* setup db connection before inflate app router and */
      const { dbList, errors: dbConfigErrors } = await this.loadDBConfig(options);
      await Promise.all(dbList.map(db => this.dbManager.setupDB(db.dbConfig)));

      /* setup server config before inflate app router and ws and bs for preload*/
      const { errors: serviceConfigErrors, serverConfigMap } = await this.loadServerConfig(options);

      // editor WSConfig must be put a head of the service WSConfig to avoid LOG_SOCKET replacement
      if (this.options.editor) {
        this.logger?.debug("setting up editor on %s", BASEEDITOR_PATH);
        const editorRouter = await createEditorRouter(this.adminInterface);
        router.use(editorRouter);
        this.logger?.debug("setting up log websocket on [%s]", LOG_SOCKET_PATH);
        wsConfigList.push(editorWSConfig);
        serverConfigMap[EDITOR_CONFIG_KEY] = editorServerConfig;
      }

      if (this.options?.hotreload/* && !options?.inflateTests*/) {
        this.logger?.debug("setting up websocket on [%s]", HOT_RELOAD_PATH);
        wsConfigList.push({
          path: HOT_RELOAD_PATH
        });
        this.logger?.debug("setting up hot-reload script on [%s]", HOT_RELOAD_SCRIPT_PATH);
        const hotReloadScriptRouter = new Router();
        hotReloadScriptRouter.get(HOT_RELOAD_SCRIPT_PATH, async (req, res) => res.js(HOT_RELOAD_JS_SCRIPT));
        router.use(hotReloadScriptRouter);
      }

      await notifiyServerConfig(this.logger, this.serverInterface, this.adminInterface, serverConfigMap, "preload");

      /* setup app (router, websocket servers files)*/
      const [serviceRouter, errors, fileMap/*, migrations*/, serviceWSConfigList/*, serverConfigMap*/, serviceLogConfigMap] = await inflateApp({
        logger: this.logger,
        services: this.options.services,
        serverInterface: this.serverInterface,
        //dbManager: this.dbManager,
        port: this.options.port,
        inflateDir: options?.inflateDir,
        inflateSea: options?.inflateSea ? true : false,
        //inflateTests: options?.inflateTests ? true : false,
        hotreload: this.options?.hotreload ? true : false,
        inflateParallel: options?.inflateParallel,
        noBuild: this.options?.noBuild,
        noMinify: this.options?.noMinify,
        inflateOnlyAssets: options?.inflateOnlyAssets,
        inflateFlat: options?.inflateFlat
      });

      wsConfigList.push(...serviceWSConfigList);
      router.use(serviceRouter);
      this.inflated = {
        router,
        logConfigMap: serviceLogConfigMap,
        errors: (errors ? errors : []).concat(dbConfigErrors).concat(serviceConfigErrors),
        fileMap,
        //migrations,
        dbList,
        wsConfigList,
        serverConfigMap
      };

      return this.inflated;
    } catch (e) {
      this.inflated = null;
      throw e;
    }
  }

  public isInflated() {
    return this.inflated ? true : false;
  }

  public isRunning() {
    return this.server !== null;
  }

  public async deflate() {
    if (this.isRunning()) {
      throw new Error("cannot deflate app running. call app.stop() first.");
    }
    if (this.inflated !== null) {
      if (this.inflated === undefined) {
        throw new Error("cannot deflate an app that is currently inflating. wait for the result with await app.inflate() first.");
      } else {
        throw new Error("cannot deflate uninflated app. call await app.inflate() first.");
      }
    }
    await this.dbManager.closeAll();
    await this.dbManager.deleteAll();
    this.inflated = null;
  }

  public async start() {
    if (this.server !== null || this.status !== "stopped") {
      throw new Error("cannot start app already running.");
    }
    if (!this.isInflated()) {
      throw new Error("cannot start uninflated app. call await app.inflate() first.");
    }
    //this.logger?.debug("starting");
    this.logger?.debug("\t\t==start==");

    //this.disconnect();
    this.status = "starting";
    this.server = undefined;
    this.httpsRedirectServer = undefined;
    this.connect();
    await this.dbManager.connectAll();
    this.server = new App({
      onUpgrade: async (req: ServerRequest, socket, head) => {
        try {
          req.server = this.serverInterface;
          return await this.webSocketManager.onUpgrade(req, socket, head);
        } catch (e) {
          this.logger?.error(e);
        }
      },
      etag: this.options?.etag ?? true,
      loggerFactory: this.loggerProvider.requestLoggerFactory,
      serverOptions: this.options?.serverOptions,
      https: this.options?.https
    });
    if (this.options?.httpRedirect) {
      this.httpsRedirectServer = new App();
      this.httpsRedirectServer.use(async (req: ServerRequest, res) => {
        const hostname = req.headers.host?.split(":")[0] ?? "";
        const allowed = this.options?.allowedRedirectHosts;
        if (allowed && !allowed.includes(hostname)) {
          res.writeHead(400).end("Invalid Host header");
          return;
        }
        return await res.redirect('https://' + hostname + ":" + this.options.port + req.url);
      });
    }

    this.webSocketManager.replaceALLWS(this.inflated.wsConfigList);

    reloadInflatedRouter(this);

    await notifiyServerConfig(this.logger, this.serverInterface, this.adminInterface, this.inflated.serverConfigMap, "load");

    if (this.logger && (cluster.isPrimary || process.env["CLUSTER_NODE_NUMBER"] === "0")) {
      /*this.logger?.debug("\t\t==http routes==");
      this.server.logPaths({
        debug: this.logger.debug.bind(this.logger),
        error: this.logger.error.bind(this.logger),
        info: this.logger.debug.bind(this.logger),
        log: this.logger.debug.bind(this.logger),
        trace: this.logger.trace.bind(this.logger),
        warn: this.logger.warn.bind(this.logger)
      });*/
      this.logger?.info("\t\t==http routes==");
      this.server.logPaths(this.logger);
    }

    this.logger?.trace("calling listen on [%s]", this.options.port);

    await this.server.listen(this.options.port);
    if (this.options?.httpRedirect) {
      await this.httpsRedirectServer.listen(this.options.httpRedirect);
    }

    if (this.options?.httpRedirect && this.logger && (cluster.isPrimary || process.env["CLUSTER_NODE_NUMBER"] === "0")) {
      this.logger?.log("\t\t==listening on [http][%s] for [https][%s] redirection==", this.options?.httpRedirect, this.options.port);
    } else if (this.options?.httpRedirect) {
      this.logger?.debug("\t\t==listening on [http][%s] for [https][%s] redirection==", this.options?.httpRedirect, this.options.port);
    }

    if (this.logger && (cluster.isPrimary || process.env["CLUSTER_NODE_NUMBER"] === "0")) {
      this.logger?.log("\t\t==listening on [%s][%s]==", this.options.https ? "https" : "http", this.options.port);
    } else {
      this.logger?.debug("\t\t==listening on [%s][%s]==", this.options.https ? "https" : "http", this.options.port);
    }

    await notifiyServerConfig(this.logger, this.serverInterface, this.adminInterface, this.inflated.serverConfigMap, "start");

    if (this.options.watch && (cluster.isPrimary || process.env["CLUSTER_NODE_NUMBER"] === "0")) {
      this.watcher = await watchAndServer(this);
    }

    this.logger?.debug("\t\t==start done==");

    this.status = "started";
    return this.inflated.errors && this.inflated.errors.length > 0 ? this.inflated.errors : null;
  }

  public async stop() {
    if (!this.server || !this.inflated || this.status !== "started") {
      throw new Error("cannot stop server not running");
    }
    this.status = "stopping";
    if (this.watcher) {
      this.watcher.stopWatch();
      this.watcher = null;
    }
    const server = this.server;
    const httpsRedirectServer = this.httpsRedirectServer;
    this.server = null;
    this.httpsRedirectServer = null;
    this.disconnect();
    this.logger?.debug("\t\t==stop==");
    this.logger?.debug("clear running server routes");
    server.clear();
    this.webSocketManager.disconnectAll();
    this.webSocketManager.deleteAllWS();
    const pD = this.dbManager.deleteAll();
    notifiyServerConfigSync(this, "unload");
    //server.ws.disconnectAll();
    this.logger?.debug("stopping");
    if (httpsRedirectServer) {
      await httpsRedirectServer.close();
    }
    const p = server.close();
    await p;
    await pD;
    this.status = "stopped";
    notifiyServerConfigSync(this, "stop");
    this.logger?.debug("\t\t==stop done==");
  }

  public async restart(avoidSend?: boolean) {
    if (!this.server || !this.inflated || this.status !== "started") {
      throw new Error("cannot start server not running");
    }
    this.logger?.debug("\t\t==restart==");
    if (process.send && !avoidSend) {
      process.send({
        type: MiqroApplicationMessageType,
        target: this.options.name,
        action: "restart",
        fromPID: process.pid
      } as MiqroClusterMessage);
    }
    await this.stop();
    const ret = await this.start();
    this.logger?.debug("\t\t==restart done==");
    return ret;
  }

  public async reload(avoidSend?: boolean) {
    if (!this.server || !this.inflated || this.status !== "started") {
      throw new Error("cannot reload server not running");
    }
    this.status = "reloading";
    /*this.logger?.log("====================");
    this.logger?.log("=======reload=======");
    this.logger?.log("====================");*/

    if (!avoidSend) {
      this.logger?.debug("\t\t==reload==");
    } else {
      this.logger?.debug("\t\t==reload==");
    }
    // block others from calling this
    const oldServerConfigMap = this.inflated.serverConfigMap;
    this.inflated = undefined;
    if (process.send && !avoidSend) {
      process.send({
        type: MiqroApplicationMessageType,
        target: this.options.name,
        action: "reload",
        fromPID: process.pid
      } as MiqroClusterMessage);
    }

    this.logger?.debug("clear running server routes");
    this.server.clear();
    await this.webSocketManager.disconnectAllButLOGSocket();
    await notifiyServerConfig(this.logger, this.serverInterface, this.adminInterface, oldServerConfigMap, "unload");

    /* force deflation*/
    await this.dbManager.closeAll();
    await this.dbManager.deleteAll();
    this.inflated = null;
    /* re-inflation */
    this.inflated = await this.inflate();
    if (!this.inflated) {
      throw new Error("inflation failed!");
    }

    reloadInflatedRouter(this);
    await this.webSocketManager.disconnectAllButLOGSocket();
    this.webSocketManager.replaceALLWSBuLOGSocket(this.inflated.wsConfigList);

    await notifiyServerConfig(this.logger, this.serverInterface, this.adminInterface, this.inflated.serverConfigMap, "load");

    if (this.logger && (cluster.isPrimary || process.env["CLUSTER_NODE_NUMBER"] === "0")) {
      this.logger?.info("\t\t==http routes==");
      this.server.logPaths(this.logger);
      /*this.server.logPaths({
        debug: this.logger.debug.bind(this.logger),
        error: this.logger.error.bind(this.logger),
        info: this.logger.debug.bind(this.logger),
        log: this.logger.debug.bind(this.logger),
        trace: this.logger.trace.bind(this.logger),
        warn: this.logger.warn.bind(this.logger)
      });*/
    }

    //this.logger?.log("=====================");
    this.logger?.debug("\t\t==reload done==");
    //this.logger?.log("=====================");

    this.status = "started";
    return this.inflated.errors && this.inflated.errors.length > 0 ? this.inflated.errors : null;

  }
}

export function ServerRequestHandler(server: ServerInterface) {
  return function ServerRequestHandler(req: ServerRequest) {
    req.server = server;
  }
}

function reloadInflatedRouter(app: Miqro) {
  if (!app.server) {
    throw new Error("not running");
  }
  if (!app.inflated) {
    throw new Error("not inflated");
  }
  app.logger?.debug("clear running server routes");
  app.server.clear();
  app.logger?.debug("load running server with new routes");

  app.server.use(app.serverRequestHandler);

  app.server.use(LoggerHandler());
  if (app.options.editor) {
    app.server.use(async (req, res) => {
      res.setHeader("x-uuid", req.uuid);
    });
  }

  app.server.use(app.inflated.router);
}

async function notifiyServerConfig(logger: Logger, serverInterface: ServerInterface, adminInterface: EditorAdminInterface, serverConfigMap: ServerConfigMap, method: "load" | "start" | "unload" | "stop" | "preload") {
  if (serverConfigMap) {
    await Promise.allSettled(Object.keys(serverConfigMap).map(name => {
      return new Promise<void>(async (resolve) => {
        try {
          const serverConfig = serverConfigMap[name];
          if (serverConfig && serverConfig[method]) {
            if (name === EDITOR_CONFIG_KEY) {
              await (serverConfig[method] as any)(serverInterface, adminInterface);
            } else {
              await serverConfig[method](serverInterface);
            }

          }
          resolve();
        } catch (e) {
          logger?.error(e);
          resolve();
        }
      })
    }));
  }
}

export function notifiyServerConfigSync(app: Miqro, method: "unload" | "stop") {
  if (app.inflated) {
    Object.keys(app.inflated.serverConfigMap).map(name => {
      try {
        if (app.inflated) {
          const serverConfig = app.inflated.serverConfigMap[name];
          if (serverConfig && serverConfig[method]) {
            serverConfig[method](app.serverInterface);
          }
        }
      } catch (e) {
        app.logger?.error(e);
      }
    });
  }
}

function createEditorLoggerTransport(app: Miqro) {
  return {
    level: "trace" as LogLevel,
    write: async (args) => {
      try {
        if (app.options.editor) {
          try {
            const ws = app.webSocketManager.getWS(LOG_SOCKET_PATH);
            if (ws) {
              //console.log("\n\n" + process.pid + " broadcasting " + LOG_SOCKET_PATH + "\n\n\n")
              await ws.broadcast(JSON.stringify({
                type: LOG_WRITE_EVENT,
                level: args.level,
                identifier: args.identifier,
                out: args.out
              }));
            }
          } catch (e) {
            console.error(e);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
}
