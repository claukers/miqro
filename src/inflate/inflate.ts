import { InflateError } from "../common/jsx.js";
import { Logger, Router } from "@miqro/core";
import { RouteFileMap, setupHTTPRouter, StaticFileMap } from "./setup-http.js";
//import { WSMapConfig } from "./utils/websocketmanager.js";
//import { ServerConfigMap, setupServerConfig } from "./setup-server-config.js";
import { assertGlobalTampered } from "../services/globals.js";
import { getServicePath } from "../common/paths.js";
import { inflateWSConfig } from "./setup-ws.js";
import { inflateAppForSea, inflateServiceForSea } from "./inflate-sea.js";
import { ServerInterface, WSConfig } from "../types.js";
import { LogConfigMap, setupLogConfig } from "./setup-log.js";
import { setupDoc } from "./setup.doc.js";

export interface InflateAppOptions {
  logger?: Logger;
  services: string[];
  //dbManager: DBManager;
  inflateDir: string | undefined | false;
  inflateSea: boolean;
  //editor: boolean;
  //inflateTests: boolean;
  hotreload?: boolean;
  port: string;
  serverInterface: ServerInterface;
}

export async function inflateApp({ serverInterface, logger, hotreload, services/*, dbManager*/, inflateDir, inflateSea/*, editor, inflateTests*/, port }: InflateAppOptions): Promise<[Router, InflateError[] | null, RouteFileMap, WSConfig[]/*, ServerConfigMap*/, LogConfigMap]> {
  logger.trace("inflateApp");
  const errors: InflateError[] = [];
  //const migrations: string[] = [];
  let routeFileMap: RouteFileMap = {};
  const wsConfigList: WSConfig[] = [];
  const router = new Router();
  const logConfigMap: LogConfigMap = {};
  //const serverConfigMap: ServerConfigMap = {};

  router.use(assertGlobalTampered);

  /*if (editor) {
    logger.info("setting up editor on %s", BASEEDITOR_PATH);
    const editorRouter = await createEditorRouter();
    router.use(editorRouter);
    logger.info("setting up ws on [%s]", LOG_SOCKET_PATH);
    wsConfigList.push(editorWSConfig);
    serverConfigMap[EDITOR_CONFIG_KEY] = editorServerConfig;
  }*/



  for (const service of services) {
    const serviceRouteFileMap: RouteFileMap = {};
    const serviceStaticFileMap: StaticFileMap | null = inflateSea ? {} : null;
    const servicePath = getServicePath(service);

    /*const migrationsFolderPath = getMigrationsPath(servicePath);

    const serviceMigrations: string[] = migrationsFolderPath ? migration.getSortedMigrations(migrationsFolderPath) : [];*/

    /*const db = dbManager.getDB(service) ? dbManager.getDB(service) : await setupDB(logger, service, dbManager, inflateDir);;

    if (db && (cluster.isPrimary || process.env["CLUSTER_NODE_NUMBER"] === "0")) {
      await runMigrations(logger, db, servicePath, service, inflateDir, serviceMigrations);
    }
    if (db) {
      migrations.push(...serviceMigrations);
    }*/

    //await setupDB(logger, service, dbConfigList, inflateDir);

    await setupLogConfig(logger, servicePath, service, logConfigMap, inflateSea ? inflateDir : false, errors);

    router.use(await setupHTTPRouter(serverInterface, logger, hotreload ? hotreload : false, servicePath, service, serviceRouteFileMap, serviceStaticFileMap, inflateDir, inflateSea, errors));
    routeFileMap = {
      ...routeFileMap,
      ...serviceRouteFileMap
    };

    await setupDoc(logger, servicePath, service, router, routeFileMap, inflateDir, errors);

    await inflateWSConfig(logger, servicePath, service, wsConfigList, inflateSea ? inflateDir : undefined, errors);

    //await setupServerConfig(logger, servicePath, service, serverConfigMap, inflateSea ? inflateDir : undefined, errors);

    if (inflateDir && inflateSea) {
      await inflateServiceForSea(logger, inflateDir, service, servicePath /*, serviceMigrations*/, serviceRouteFileMap, serviceStaticFileMap);
    }

    /*if (inflateTests) {
      await setupTests(logger, servicePath);
    }*/
  }

  if (inflateDir && inflateSea) {
    await inflateAppForSea(logger, inflateDir, services, port);
  }

  router.use(assertGlobalTampered);

  return errors.length === 0 ? [router, null, routeFileMap/*, migrations*/, wsConfigList/*, serverConfigMap*/, logConfigMap] : [router, errors, routeFileMap/*, migrations*/, wsConfigList/*, serverConfigMap*/, logConfigMap];
}
