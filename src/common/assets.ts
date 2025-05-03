import { Logger, MinimalLogger } from "@miqro/core";
import { chmodSync, constants, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { getAsset as seaGetAsset, isSea } from "node:sea";
import { dirname, resolve } from "node:path";
import { calculateChecksum, calculateChecksumFromBuffer } from "./checksum.js";
import { arch, cwd, platform } from "node:process";
import { fileURLToPath } from 'node:url';
import { initESBuild } from "./esbuild.js";
import { initJSXJS } from "./jsx.js";

const __package_dirname = import.meta.url ? resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..") : null;

const ASSETS_ROUTER = {
  "lib.cjs": "build/lib.cjs",
  "version.tag": "sea/version.tag",
  "node.version.tag": "sea/node.version.tag",
  "esbuild.version.tag": "sea/esbuild.version.tag",
  "postject.base64.cjs": "build/postject.base64.cjs",
  "sea.basic.config.json": "sea/basic-config.json",
  "node.sh": "sea/node.sh",
  "install-nodejs.sh": "sea/install-nodejs.sh",
  "compile.base64.sh": "sea/basic-compile.base64.sh",
  "sign-remove.sh": "sea/sign-remove.sh",
  "sign-add.sh": "sea/sign-add.sh",
  "app.sh": "sea/app.sh",
  "jsx.dom.js": "build/jsx.dom.js",
  "types.json": "sea/types.json",
  "editor-assets/editor.bundle.js": "build/editor.bundle.js",
  "editor-assets/style.css": "editor/http/admin/editor/style.css",
  "editor-assets/font.ttf": "editor/http/admin/editor/font.ttf"
}

export function getAsset(key: string): ArrayBuffer {
  if (isSea()) {
    return seaGetAsset(key);
  } else {
    if (!ASSETS_ROUTER[key]) {
      if (key === "esbuild-binary") {
        if (__package_dirname === null) {
          return readFileSync(resolve(`./sea/esbuild`));
        } else {
          return readFileSync(resolve(__package_dirname, `./node_modules/@esbuild/${platform}-${arch}/bin/esbuild`));
        }
      } else {
        throw new Error("asset not registered!");
      }
    }
    return readFileSync(resolve(__package_dirname, ASSETS_ROUTER[key]));
  }
}

export function getVersion() {
  const VERSION = !isSea() ? "" : Buffer.from(getAsset("version.tag")).toString().trim();
  const NODE_VERSION = !isSea() ? "" : Buffer.from(getAsset("node.version.tag")).toString().trim();
  const ESBUILD_VERSION = !isSea() ? "" : Buffer.from(getAsset("esbuild.version.tag")).toString().trim();
  return {
    VERSION,
    NODE_VERSION,
    ESBUILD_VERSION
  }
}

export async function initAssets(logger: Logger) {
  const { VERSION, NODE_VERSION, ESBUILD_VERSION } = getVersion();
  if (isSea()) {
    logger.debug("version [%s]", VERSION);
    logger.debug("Node.js version [%s]", NODE_VERSION);
    logger.debug("esbuild version [%s]", ESBUILD_VERSION);
  }
  logger.debug("platform [%s-%s]", platform, arch);
  await Promise.all([initJSXJS(logger), initESBuild(logger)]);
}

export async function initTypes(logger: MinimalLogger) {
  const typesJSON = JSON.parse(Buffer.from(getAsset("types.json")).toString("utf-8"));
  await Promise.all(Object.keys(typesJSON).map(typeFile =>
    initAsset(logger, resolve(cwd(), "." + typeFile), Buffer.from(typesJSON[typeFile], "base64"))
  ));
}

export async function validateAsset(logger: MinimalLogger | undefined, path: string, internalChecksum: string): Promise<boolean> {
  mkdirSync(dirname(path), {
    recursive: true
  });
  if (existsSync(path)) {
    logger?.trace("validating [%s]", path);
    const checksum = await calculateChecksum(path);
    //const internalChecksum = await calculateChecksumFromBuffer(buffer);
    if (internalChecksum !== checksum) {
      logger?.trace("invalid [%s] checksum", path);
      return false;
    } else {
      logger?.trace("validated [%s]", path);
      return true;
    }
  } else {
    logger?.trace("invalid [%s] doesnt exists", path);
    return false;
  }
}

export async function initAsset(logger: MinimalLogger, path: string, buffer: Buffer, executable?: boolean, checksum?: Promise<string>, logInstallasInfo = true) {
  const valid = await validateAsset(logger, path, checksum === undefined ? await calculateChecksumFromBuffer(buffer) : await checksum);
  if (existsSync(path)) {
    if (!valid) {
      logger.info("updating [%s]", path);
      unlinkSync(path);
      writeFileSync(path, buffer);
      if (executable) {
        chmodSync(path, constants.S_IXUSR | constants.S_IRUSR | constants.S_IWUSR);
      }
    }
  } else {
    if (!logInstallasInfo) {
      logger.debug("installing [%s]", path);
    } else {
      logger.info("installing [%s]", path);
    }
    writeFileSync(path, buffer);
    if (executable) {
      chmodSync(path, constants.S_IXUSR | constants.S_IRUSR | constants.S_IWUSR);
    }
  }
}
