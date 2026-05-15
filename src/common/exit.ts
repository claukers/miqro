import { existsSync, rmdirSync, unlinkSync } from "node:fs";
//import { notifiyServerStop, notifiyServerUnLoad } from "../services/server.js";
import { getESBuildBinaryPath/*, getJSXJSPath*/, JSX_TMP_DIR } from "./paths.js";
import { CLEAR_JSX_CACHE } from "./constants.js";
import { resolve } from "node:path";
import { EXIT_CODES } from "./constants.js";
import { Miqro } from "../services/app.js";

function cleanJSX(app: Miqro) {
  app.logger?.trace("trying to clean up esbuild installation at [%s]", getESBuildBinaryPath());
  if (existsSync(getESBuildBinaryPath())) {
    unlinkSync(getESBuildBinaryPath());
  }
  if (CLEAR_JSX_CACHE) {
    try {
      const buildParendDir = resolve(JSX_TMP_DIR, String(process.pid));
      app.logger?.trace("trying to clean up jsx build/import folders at [%s]", buildParendDir);
      const buildDir = resolve(buildParendDir, "build");
      const importDir = resolve(buildParendDir, "import");
      if (existsSync(buildDir)) {
        rmdirSync(buildDir);
      }
      if (existsSync(importDir)) {
        rmdirSync(importDir);
      }
      if (existsSync(buildParendDir)) {
        rmdirSync(buildParendDir);
      }
    } catch (e) {
      app.logger?.error(e);
    }
  }
}

export function setupExitHandlers(app: Miqro) {
  let exceptionOccured = false;

  process.on('uncaughtException', async function (err) {
    app.logger?.error('Caught exception: ' + err);
    app.logger?.error(err);
    exceptionOccured = true;
    cleanJSX(app);
    if (app.status === "started") {
      await app.stop();
    }
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });

  process.on('exit', function (code) {
    if (exceptionOccured) {
      app.logger?.error('Exception occured');
    } else {
      cleanJSX(app);
      if (app.status === "started") {
        app.stop();
      }
    }
  });

  process.on('unhandledRejection', async (reason) => {
    app.logger?.error('Unhandled rejection:');
    app.logger?.error(reason);
    exceptionOccured = true;
    cleanJSX(app);
    if (app.status === "started") {
      await app.stop();
    }
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });

  process.on("SIGTERM", async function () {
    app.logger?.info('SIGTERM received');
    if (app.status === "started") {
      await Promise.race([
        app.stop(),
        new Promise(r => setTimeout(r, 5000))
      ]);
    }
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });

  process.on('SIGHUP', async function () {
    app.logger?.info('SIGHUP received');
    if (app.status === "started") {
      await Promise.race([
        app.stop(),
        new Promise(r => setTimeout(r, 5000))
      ]);
    }
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });

  /*process.on('SIGKILL', function () {
    server.logger.info('SIGKILL received');
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });*/

  process.on('SIGINT', async function () {
    app.logger?.info('SIGINT received');
    if (app.status === "started") {
      await Promise.race([
        app.stop(),
        new Promise(r => setTimeout(r, 5000))
      ]);
    }
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });
}
