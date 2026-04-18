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
    /*app.logger?.trace("trying to clean up jsx.js installation at [%s]", getJSXJSPath());
    if (existsSync(getJSXJSPath())) {
      unlinkSync(getJSXJSPath());
    }*/
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
  }
}

export function setupExitHandlers(app: Miqro) {
  let exceptionOccured = false;

  process.on('uncaughtException', async function (err) {
    app.logger?.error('Caught exception: ' + err);
    app.logger?.error(err);
    exceptionOccured = true;
    /*if (app.server) {
      notifiyServerConfigSync(app, "unload");
      notifiyServerConfigSync(app, "stop");
      app.webSocketManager.disconnectAll();
      app.dbManager.closeAll();
    }*/
    cleanJSX(app);
    if (app.server) {
      await app.stop();
    }
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });

  process.on('exit', function (code) {
    if (exceptionOccured) {
      app.logger?.error('Exception occured');
    } else {
      /*if (app.server) {
        notifiyServerConfigSync(app, "unload");
        notifiyServerConfigSync(app, "stop");
        app.webSocketManager.disconnectAll();
        app.dbManager.closeAll();
      }*/
      cleanJSX(app);
      if (app.server) {
        app.stop();
      }
    }
  });

  process.on('unhandledRejection', async (reason) => {
    app.logger?.error('Unhandled rejection:');
    app.logger?.error(reason);
    exceptionOccured = true;
    /*if (app.server) {
      notifiyServerConfigSync(app, "unload");
      notifiyServerConfigSync(app, "stop");
      app.webSocketManager.disconnectAll();
      app.dbManager.closeAll();
    }*/
    cleanJSX(app);
    if (app.server) {
      await app.stop();
    }
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });

  process.on("SIGTERM", function () {
    app.logger?.info('SIGTERM received');
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });

  process.on('SIGHUP', function () {
    app.logger?.info('SIGHUP received');
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });

  /*process.on('SIGKILL', function () {
    server.logger.info('SIGKILL received');
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });*/

  process.on('SIGINT', function () {
    app.logger?.info('SIGINT received');
    process.exit(EXIT_CODES.ABNORMAL_UNCONTROLLED);
  });
}
