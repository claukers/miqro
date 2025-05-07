import { Logger } from "@miqro/core";
import { chmodSync, constants, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { cwd, platform } from "node:process";

import { RouteFileMap, StaticFileMap } from "./setup-http.js";
import { getAuthConfigPath, getCORSConfigPath, getDBConfigPath, getMigrationsPath, getServerConfigPath, getServicePath, getWSConfigPath } from "../common/paths.js";
import { getAsset } from "../common/assets.js";
import { migration } from "@miqro/query";

//export const libCJSBuffer = Buffer.from(getAsset("lib.cjs"));
/*export const COMPILESH = Buffer.from(Buffer.from(getAsset("compile.base64.sh")).toString(), "base64");
export const SIGN_REMOVESH = Buffer.from(getAsset("sign-remove.sh"));
export const SIGN_ADDSH = Buffer.from(getAsset("sign-add.sh"));
export const INSTALLNODEJSSH = Buffer.from(getAsset("install-nodejs.sh"));
export const APPSH = Buffer.from(getAsset("app.sh"));
export const NODESH = Buffer.from(getAsset("node.sh"));
export const SEACONFIGJSON = Buffer.from(getAsset("sea.basic.config.json"));
export const POSTJECTCJS = Buffer.from(Buffer.from(getAsset("postject.base64.cjs")).toString(), "base64");*/

export async function inflateSeaAssets(logger: Logger, inflateDir: string) {
  const esbuildBinaryBuffer = Buffer.from(getAsset("esbuild-binary"));
  if (platform === "win32") {
    writeFile(logger, resolve(inflateDir, "sea", "esbuild.exe"), esbuildBinaryBuffer);
    chmodSync(resolve(inflateDir, "sea", "esbuild.exe"), constants.S_IXUSR | constants.S_IRUSR | constants.S_IWUSR);
  } else {
    writeFile(logger, resolve(inflateDir, "sea", "esbuild"), esbuildBinaryBuffer);
    chmodSync(resolve(inflateDir, "sea", "esbuild"), constants.S_IXUSR | constants.S_IRUSR | constants.S_IWUSR);
  }
  writeFile(logger, resolve(inflateDir, "sea", "postject.cjs"), Buffer.from(Buffer.from(getAsset("postject.base64.cjs")).toString(), "base64"));
  writeFile(logger, resolve(inflateDir, "sea", "config.json"), Buffer.from(getAsset("sea.basic.config.json")));
  writeFile(logger, resolve(inflateDir, "sea", "run.sh"), Buffer.from(getAsset("app.sh")));
  writeFile(logger, resolve(inflateDir, "sea", "node.sh"), Buffer.from(getAsset("node.sh")));
  writeFile(logger, resolve(inflateDir, "compile.sh"), Buffer.from(Buffer.from(getAsset("compile.base64.sh")).toString(), "base64"));
  writeFile(logger, resolve(inflateDir, "sea", "sign-add.sh"), Buffer.from(getAsset("sign-add.sh")));
  writeFile(logger, resolve(inflateDir, "sea", "sign-remove.sh"), Buffer.from(getAsset("sign-remove.sh")));
  writeFile(logger, resolve(inflateDir, "install-nodejs.sh"), Buffer.from(getAsset("install-nodejs.sh")));
}

export async function inflateAppForSea(logger: Logger, inflateDir: string, services: string[]) {

  inflateSeaAssets(logger, inflateDir);

  writeFile(logger, resolve(inflateDir, "sea", "lib.cjs"), Buffer.from(getAsset("lib.cjs")));

  const WSLIST = services.filter(service => getWSConfigPath(resolve(cwd(), service))).map(service => {
    return `(await import("../${service}/ws.js")).default`;
  }).join(",")

  const SERVERCONFIGLIST = services.filter(service => getServerConfigPath(resolve(cwd(), service))).map(service => {
    return `(await import("../${service}/server.js")).default`;
  }).join(",\n");

  const DBCONFIGLIST = services.filter(service => getDBConfigPath(resolve(cwd(), service))).map(service => {
    return `new Promise(async (resolve, reject) => {
    try {
      const db = await dbManager.setupDB((await import("../${service}/db.js")).default);
      await (await import("./${service}/migration-up.js")).runMigrations(db);
      resolve();
    } catch(e) {
      reject(e);
    }
    
  })`;
  }).join(",");

  writeFile(logger, join(inflateDir, "sea", "package.json"), `{ "type": "module", "private": true }`);

  writeFile(logger, join(inflateDir, "sea", "app.cjs"), `const { ServerInterfaceImpl, ServerRequestHandler, WebSocketManager, initGlobals, DBManager, App, LoggerHandler, LogProvider, LocalCache, ClusterCache } = require("./lib.cjs");

async function main() {
  const PORT = process.env["PORT"] ? process.env["PORT"] : 8080; 
  const logProvider = new LogProvider();
  const localCache = new LocalCache();
  const cache = new ClusterCache();
  const webSocketManager = new WebSocketManager();
  const dbManager = new DBManager();
  await initGlobals();
  const serverInterface = new ServerInterfaceImpl({
    cache,
    localCache,
    logProvider,
    wsManager: webSocketManager,
    logger: logProvider.getLogger("server"),
    dbManager,
    port: PORT
  });

  await Promise.all([${DBCONFIGLIST}]);

  ${!WSLIST ? "" : `\n  webSocketManager.replaceALLWS(await Promise.all([${WSLIST}]))`}
  const app = new App({
    onUpgrade: webSocketManager.onUpgrade
  });
  ${SERVERCONFIGLIST ? `\n  await Promise.all([${SERVERCONFIGLIST}].filter(config=>config.preload).map(config=>config.preload(serverInterface)));\n` : ""}
  app.use(ServerRequestHandler(serverInterface));
  app.use(LoggerHandler());
  ${services.map(service => {
    const servicePath = getServicePath(service);
    return `${getCORSConfigPath(servicePath) ? `app.use(server.middleware.cors((await import("../${service}/cors.js")).default));` : ""}`
  })}
  ${services.map(service => {
    const servicePath = getServicePath(service);
    return `${getAuthConfigPath(servicePath) ? `app.use(server.middleware.session((await import("../${service}/auth.js")).default));` : ""}`
  })}
  ${services.map(service => `
  app.use(await (await import("./${join(service, "api-router.js")}")).setupRouter());
  app.use(await (await import("./${join(service, "static-router.js")}")).setupRouter())`).join("\n")}
  ${SERVERCONFIGLIST ? `\n  await Promise.all([${SERVERCONFIGLIST}].filter(config=>config.load).map(config=>config.load(serverInterface)));\n` : ""}
  

  await app.listen(PORT);
  ${SERVERCONFIGLIST ? `\n  await Promise.all([${SERVERCONFIGLIST}].filter(config=>config.start).map(config=>config.start(serverInterface)));` : ""}
}
main().catch(e=>console.error(e));
`
  );
}

export async function inflateServiceForSea(logger: Logger, inflateDir: string, service: string, servicePath: string/*, serviceMigrations: string[]*/, serviceRouteFileMap: RouteFileMap, serviceStaticFileMap: StaticFileMap) {
  const migrationsFolderPath = getMigrationsPath(servicePath);

  const serviceMigrations: string[] = migrationsFolderPath ? migration.getSortedMigrations(migrationsFolderPath) : [];
  writeFile(logger, join(inflateDir, "sea", service, "api-router.js"), `import { appendAPIModule, Router } from "./../lib.cjs";\n
export async function setupRouter() {
  const router = new Router();

${Object.keys(serviceRouteFileMap)
      .map(filePath => serviceRouteFileMap[filePath])
      .filter(data => data.previewMethod === "api")
      .map(data => data.routes.map(r => {
        const rPath = r.inflatePath;
        if (rPath) {
          const apiInflatedPath = join("..", "..", service, "http", rPath + ".api.js");
          return `  await appendAPIModule(router, "../../${service}/http", "./${apiInflatedPath}", (await import("./${apiInflatedPath}")).default);`;
        } else {
          return "";
        }
      }).filter(l => l)[0])
      .join("\n")}

  return router;
}`);

  writeFile(logger, join(inflateDir, "sea", service, "migration-up.js"), `import { migration } from "./../lib.cjs";\n
export async function runMigrations(db) {
  await migration.init(db);
${serviceMigrations.map(file => {
    const name = `${file.substring(0, file.length - extname(file).length)}`;
    return `  await migration.up.module(db, "${name}", (await import("../../${service}/migration/${name}.js")).default)`;
  }).join("\n")}
}`);

  writeFile(logger, join(inflateDir, "sea", service, "migration-down.js"), `import { migration } from "./../lib.cjs";\n
export async function runMigrations(db) {
  await migration.init(db);
${serviceMigrations.reverse().map(file => {
    const name = `${file.substring(0, file.length - extname(file).length)}`;
    return `  await migration.down.module(db, "${name}", (await import("../../${service}/migration/${name}.js")).default)`;
  }).join("\n")}
}`);

  const staticFiles = Object.keys(serviceStaticFileMap);
  /*if (staticFiles.length !== 0) {
    writeFile(logger, join(inflateDir, "sea", service, "static.base64.json"), JSON.stringify(serviceStaticFileMap));
  }*/
  writeFile(logger, join(inflateDir, "sea", service, "static-router.js"), `import { appendAPIModule, Router } from "./../lib.cjs";\n
export async function setupRouter() {
  const router = new Router();
  ${staticFiles.length === 0 ? "" : `
${staticFiles.map((filePath) => {
    return `  router.get("${serviceStaticFileMap[filePath].path}", async (_, res) => {
    return res.asyncEnd({
      status: 200,
      headers: {
        ["Content-Type"]: "${serviceStaticFileMap[filePath].contentType}"
      },
      body: Buffer.from("${serviceStaticFileMap[filePath].body.toString("base64")}", "base64")
    });
  });`;
  }).join("\n")}
`}
  return router;
}`);

}

function writeFile(logger: Logger, path: string, buffer: Buffer | string) {
  logger.log("writing [%s]", relative(cwd(), path));
  mkdirSync(dirname(path), {
    recursive: true
  });
  writeFileSync(path, buffer);
}
