//import { createRequire } from 'node:module';
import { Logger, MinimalLogger } from "@miqro/core";
import { chmodSync, constants, existsSync, lstatSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { getAsset as seaGetAsset, isSea } from "node:sea";
import { dirname, join, resolve } from "node:path";
import { calculateChecksum, calculateChecksumFromBuffer } from "./checksum.js";
import { arch, cwd, platform } from "node:process";
import { fileURLToPath } from 'node:url';
import { esBuild, initESBuild } from "./esbuild.js";
import { mkdirASync, unlinkASync, writeFileASync } from "./fs.js";
// import { initJSXJS } from "./jsx.js";
//const require = createRequire(import.meta.url);

export const __package_dirname = import.meta.url ? resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..") : null;

const ASSETS_ROUTER = {
  "lib.cjs": "build/lib.cjs",
  "version.tag": "sea/version.tag",
  "node.version.tag": "sea/node.version.tag",
  "esbuild.version.tag": "sea/esbuild.version.tag",
  // "postject.base64.cjs": "build/postject.base64.cjs",
  "sea.basic.config.json": "sea/basic-config.json",
  "node.sh": "sea/node.sh",
  "install-nodejs.sh": "sea/install-nodejs.sh",
  "compile.base64.sh": "sea/basic-compile.base64.sh",
  "sign-remove.sh": "sea/sign-remove.sh",
  "sign-add.sh": "sea/sign-add.sh",
  "app.sh": "sea/app.sh",
  // "jsx.dom.js": "build/jsx.dom.js",
  // "types.json": "sea/types.json",
  "assets.base64.json": "sea/assets.base64.json",
  "editor-assets/editor.bundle.js": "build/editor.bundle.js",
  "editor-assets/style.css": "build/style.css"
  //"editor-assets/font.ttf": "build/font.ttf"
}

export function getAsset(key: string): Buffer {
  if (isSea()) {
    return Buffer.from(seaGetAsset(key));
  } else {
    if (!ASSETS_ROUTER[key]) {
      if (key === "esbuild-binary") {
        if (__package_dirname === null) {
          return readFileSync(resolve(`./sea/esbuild`));
        } else {
          //return readFileSync(resolve(__package_dirname, `./node_modules/@esbuild/${platform}-${arch}/bin/esbuild`));
          const esBinaryPath = resolve(dirname(import.meta.resolve(`esbuild`).substring("file://".length)), "..", "..", "@esbuild", `${platform}-${arch}`);
          return readFileSync(resolve(esBinaryPath, "bin", "esbuild"));
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
  // await Promise.all([initJSXJS(logger), initESBuild(logger)]);
  await Promise.all([initESBuild(logger)]);
}

/*export async function initTypes(logger: MinimalLogger) {
  const typesJSON = JSON.parse(Buffer.from(getAsset("types.json")).toString("utf-8"));
  await Promise.all(Object.keys(typesJSON).map(typeFile =>
    initAsset(logger, resolve(cwd(), "." + typeFile), Buffer.from(typesJSON[typeFile], "base64"))
  ));
}*/

export async function installAsset(logger: MinimalLogger, include: string[]) {
  const assetsJSON = JSON.parse(Buffer.from(getAsset("assets.base64.json")).toString("utf-8"));
  await Promise.all(assetsJSON.map(asset => {
    for (const i of include) {
      if (asset.path.indexOf(i) === 0) {
        return initAsset(logger, join(cwd(), asset.path), Buffer.from(asset.content, "base64"))
      }
    }
    return Promise.resolve();
  }));
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
      await unlinkASync(path);
      if (!statSync(dirname(path)).isDirectory()) {
        await mkdirASync(dirname(path), {
          recursive: true
        });
      }
      await writeFileASync(path, buffer);
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
    await writeFileASync(path, buffer);
    if (executable) {
      chmodSync(path, constants.S_IXUSR | constants.S_IRUSR | constants.S_IWUSR);
    }
  }
}
