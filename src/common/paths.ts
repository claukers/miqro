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

const EXTENSIONS = [".ts", ".js", ".cjs"];

function getFilePath(dirname: string, name: string, extensions: string[]) {
  for (const ex of extensions) {
    const path = resolve(dirname, name + ex);
    if (existsSync(path) && !statSync(path).isDirectory()) {
      return path;
    }
  }
  return false;
}

export function getLogConfigPath(servicePath: string) {
  return getFilePath(servicePath, "log", EXTENSIONS);
}

export function getCORSConfigPath(servicePath: string) {
  return getFilePath(servicePath, "cors", EXTENSIONS);
}

export function getServerConfigPath(servicePath: string) {
  return getFilePath(servicePath, "server", EXTENSIONS);
}

export function getWSConfigPath(servicePath: string) {
  return getFilePath(servicePath, "ws", EXTENSIONS);
}

export function getDBConfigPath(servicePath: string) {
  return getFilePath(servicePath, "db", EXTENSIONS);
}

export function getStaticFilesPath(servicePath: string) {
  const staticFilesPath = resolve(servicePath, "static");
  if (existsSync(staticFilesPath) && statSync(staticFilesPath).isDirectory()) {
    return staticFilesPath;
  }
  return false;
}

export function getMiddlewareConfigPath(servicePath: string) {
  return getFilePath(servicePath, "middleware", EXTENSIONS);
}

export function getErrorConfigPath(servicePath: string) {
  return getFilePath(servicePath, "catch", EXTENSIONS);
}

export function getDocConfigPath(servicePath: string) {
  return getFilePath(servicePath, "doc", EXTENSIONS);
}

export function getMiqroJSONPath() {
  const miqroRCPath = resolve(cwd(), "miqro.json");
  if (existsSync(miqroRCPath) && !statSync(miqroRCPath).isDirectory()) {
    return miqroRCPath;
  }
  return false;
}

export function getAuthConfigPath(servicePath: string) {
  return getFilePath(servicePath, "auth", EXTENSIONS);
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

