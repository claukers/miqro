import { checkEnvVariable } from "@miqro/core";
import { randomUUID } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { cwd, platform } from "node:process";

export const JSX_TMP_DIR = checkEnvVariable(`JSX_TMP`, resolve(tmpdir(), "jsx_tmp"));

export const TEST_SOCKET = resolve(JSX_TMP_DIR, `test.${randomUUID()}.sock`);

export function getServicePath(service: string) {
  return resolve(cwd(), service);
}

export function getLogConfigPath(servicePath: string) {
  const logConfigPath = resolve(servicePath, "log.ts");
  const logConfigPathJS = resolve(servicePath, "log.js");
  if (existsSync(logConfigPath) && !statSync(logConfigPath).isDirectory()) {
    return logConfigPath;
  } else if (existsSync(logConfigPathJS) && !statSync(logConfigPathJS).isDirectory()) {
    return logConfigPathJS;
  }
  return false;
}

export function getCORSConfigPath(servicePath: string) {
  const corsPath = resolve(servicePath, "cors.ts");
  const corsPathJS = resolve(servicePath, "cors.js");
  if (existsSync(corsPath) && !statSync(corsPath).isDirectory()) {
    return corsPath;
  } else if (existsSync(corsPathJS) && !statSync(corsPathJS).isDirectory()) {
    return corsPathJS;
  }
  return false;
}

export function getServerConfigPath(servicePath: string) {
  const serverPath = resolve(servicePath, "server.ts");
  const serverPathJS = resolve(servicePath, "server.js");
  if (existsSync(serverPath)) {
    return serverPath;
  } else if (existsSync(serverPathJS)) {
    return serverPathJS;
  }
  return false;
}

export function getWSConfigPath(servicePath: string) {
  const wsPath = resolve(servicePath, "ws.ts");
  const wsPathJS = resolve(servicePath, "ws.js");
  if (existsSync(wsPath)) {
    return wsPath;
  } else if (existsSync(wsPathJS)) {
    return wsPathJS;
  }
  return false;
}

export function getDBConfigPath(servicePath: string) {
  const dbPath = resolve(servicePath, "db.ts");
  const dbPathJS = resolve(servicePath, "db.js");
  if (existsSync(dbPath)) {
    return dbPath;
  } else if (existsSync(dbPathJS)) {
    return dbPathJS;
  }
  return false;
}

export function getStaticFilesPath(servicePath: string) {
  const staticFilesPath = resolve(servicePath, "static");
  if (existsSync(staticFilesPath) && statSync(staticFilesPath).isDirectory()) {
    return staticFilesPath;
  }
  return false;
}

export function getMiddlewareConfigPath(servicePath: string) {
  const middlewarePath = resolve(servicePath, "middleware.ts");
  const middlewarePathJS = resolve(servicePath, "middleware.js");
  if (existsSync(middlewarePath) && !statSync(middlewarePath).isDirectory()) {
    return middlewarePath;
  } else if (existsSync(middlewarePathJS) && !statSync(middlewarePathJS).isDirectory()) {
    return middlewarePathJS;
  }
  return false;
}

export function getErrorConfigPath(servicePath: string) {
  const errorPath = resolve(servicePath, "catch.ts");
  const errorPathJS = resolve(servicePath, "catch.js");
  if (existsSync(errorPath) && !statSync(errorPath).isDirectory()) {
    return errorPath;
  } else if (existsSync(errorPathJS) && !statSync(errorPathJS).isDirectory()) {
    return errorPathJS;
  }
  return false;
}

export function getAuthConfigPath(servicePath: string) {
  const authPath = resolve(servicePath, "auth.ts");
  const authPathJS = resolve(servicePath, "auth.js");
  if (existsSync(authPath) && !statSync(authPath).isDirectory()) {
    return authPath;
  } else if (existsSync(authPathJS) && !statSync(authPathJS).isDirectory()) {
    return authPathJS;
  }
  return false;
}

export function getHTTPRouterPath(servicePath: string) {
  const apiRouterPath = resolve(servicePath, "http");
  if (existsSync(apiRouterPath) && statSync(apiRouterPath).isDirectory()) {
    return apiRouterPath;
  }
  return false;
}

export function getMigrationsPath(servicePath: string) {
  const migrationsFolderPath = resolve(servicePath, "migration");
  if (existsSync(migrationsFolderPath) && statSync(migrationsFolderPath).isDirectory()) {
    return migrationsFolderPath;
  }
  return false;
}

export function getESBuildBinaryPath() {
  if (platform === "win32") {
    return resolve(JSX_TMP_DIR, String(process.pid), "esbuild.exe");
  } else {
    return resolve(JSX_TMP_DIR, String(process.pid), "esbuild");
  }
}

export function getJSXJSPath() {
  return resolve(JSX_TMP_DIR, String(process.pid), "jsx.js");
}

