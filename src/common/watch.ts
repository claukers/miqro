import "../services/globals.js";
import { FSWatcher, existsSync, readdirSync, statSync, watch } from "node:fs";
import { resolve } from "node:path";
import { Miqro } from "../services/app.js";

export async function watchAndServer(app: Miqro) {
  let timeout: any;
  const watchLogger = app.logger;
  const watchers: FSWatcher[] = [];

  /*await start({
    logger,
    webSocketManager,
    dbManager,
    services,
    editor,
    inflateTests: false,
    inflateDir: false,
    inflateSea: false,
    runOnTestPort: false
  });*/

  //await app.start();

  function watchHandler(eventType: any, filename: any) {
    stopWatch();
    watchLogger?.debug(`event type is: ${eventType}`);
    if (filename) {
      watchLogger?.debug(`filename provided: ${filename}`);
    } else {
      watchLogger?.debug('filename not provided');
    }
    watchLogger?.info(`${eventType} on ${filename}`);
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      try {
        stopWatch();
        setTimeout(async () => {
          watchLogger?.debug("closed");
          await app.reload();
          reWatch();
        }, 500);
      } catch (e) {
        watchLogger?.error(e);
      }
    }, 2000);
  }

  function watchDir(toWatch: string) {
    clearTimeout(timeout);
    const files = existsSync(toWatch) ? readdirSync(toWatch) : [];
    for (const file of files) {
      const filePath = resolve(toWatch, file);
      if (statSync(filePath).isDirectory()) {
        watchDir(filePath);
      } else {
        //console.log("toWatch=" + filePath);
        watchers.push(watch(filePath, watchHandler));
      }
    }
  }

  function stopWatch() {
    clearTimeout(timeout);
    const toClose = watchers.splice(0, watchers.length);
    for (const watcher of toClose) {
      watcher.close();
    }
  }


  function reWatch() {
    stopWatch();
    clearTimeout(timeout);
    for (const service of app.options.services) {
      const toWatch = resolve(process.cwd(), service);
      watchDir(toWatch);
    }
  }

  watchLogger?.info("watching for changes on [%s]", app.options.services.join(","));
  reWatch();
  return {
    stopWatch: () => {
      stopWatch();
    }
  };
}
