import { exec } from "node:child_process";
import { getAsset, initAsset, validateAsset } from "./assets.js";
import { Logger } from "@miqro/core";
import { getESBuildBinaryPath } from "./paths.js";
import { dirname } from "node:path";
import { calculateChecksumFromBuffer } from "./checksum.js";

let esbuildBinaryBuffer = null; // Buffer.from(getAsset("esbuild-binary"));
let esbuildBinaryChecksumPromise = null; // calculateChecksumFromBuffer(esbuildBinaryBuffer);

export async function validateESBuild(logger?: Logger) {
  return validateAsset(logger, getESBuildBinaryPath(), await esbuildBinaryChecksumPromise);
}

export async function initESBuild(logger: Logger) {
  esbuildBinaryBuffer = esbuildBinaryBuffer ? esbuildBinaryBuffer : Buffer.from(getAsset("esbuild-binary"));
  esbuildBinaryChecksumPromise = esbuildBinaryChecksumPromise ? esbuildBinaryChecksumPromise : calculateChecksumFromBuffer(esbuildBinaryBuffer);
  return initAsset(logger, getESBuildBinaryPath(), esbuildBinaryBuffer, true, esbuildBinaryChecksumPromise, false);
}

/*const NODEJS_EXTERNAL = [
  "node:cluster",
  "node:assert",
  "node:util",
  "node:path",
  "node:fs",
  "node:crypto",
  "node:http",
  "node:https",
  "node:os",
  "node:dns",
  "node:string_decoder",
  "node:stream",
  "node:http2",
  "node:net",
  "node:worker_threads",
  "node:process",
  "child_process",
  "node:child_process",
  "core",
  "globals",
  "jsx.globals",
  "server.globals",
  "browser.globals",
  "sqlite3",
  "pg"
];*/

const NODEJS_EXTERNAL = [];

export async function esBuild(options: {
  platform?: string;
  entryPoints: [string];
  bundle?: boolean;
  jsxFactory?: string;
  jsxFragment?: string;
  minify?: boolean;
  outfile?: string;
}, logger?: Logger): Promise<{
  outputFiles: {
    path: string;
    contents: any;
  }[]
}> {
  return new Promise(async (resolve, reject) => {
    try {
      //const logger = getLogger(`${SERVER_IDENTIFIER}_ESBUILD`);
      const valid = await validateESBuild(logger);
      const esBuildCMD = `${getESBuildBinaryPath()} "${options.entryPoints[0]}" ${NODEJS_EXTERNAL.map(e => `--external:${e}`).join(" ")} --loader:.js=jsx --jsx-factory=${options.jsxFactory} --jsx-fragment=${options.jsxFragment} ${options.bundle ? " --bundle" : ""}${options.minify ? " --minify" : ""}${options.outfile ? ` --outfile="${options.outfile}"` : ""}${options.platform ? ` --platform=${options.platform}` : ""}`;
      logger?.trace(esBuildCMD);
      if (!valid) {
        const err = new Error(`esbuild installation at [${getESBuildBinaryPath()}] tampered`);
        reject(err);
      } else {
        exec(esBuildCMD, {
          maxBuffer: 1024 * 1000 * 2000,
          cwd: dirname(options.entryPoints[0])
        }, (err, stdout, _stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              outputFiles: [{
                path: "",
                contents: stdout
              }]
            });
          }
        });
      }
    } catch (e) {
      logger?.error(e);
      reject(e);
    }
  });
}
