import { randomUUID } from "node:crypto";
import { ServerConfig, ServerInterface } from "../src/types.js";
import { BASEEDITOR_PATH } from "./common/constants.js";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { ADMIN_EDITOR_AUTH_KEY, ADMIN_EDITOR_AUTH_QUERY } from "./auth.js";
import { EditorAdminInterface } from "./common/admin-interface.js";
//import { getEditorAdmin } from "./common/admin-interface.js";

const ADMIN_EDITOR_BROWSER_OPEN_KEY = "ADMIN_EDITOR_BROWSER_OPEN_KEY$$";

export default {
  preload: (serverInterface: ServerInterface, adminInterface: EditorAdminInterface) => {
    //console.dir(server);
    if (serverInterface?.isPrimaryWorker()) {
      const cache = (adminInterface ? adminInterface.getCache() : serverInterface.cache);
      if (!cache.has(ADMIN_EDITOR_AUTH_KEY)) {
        const adminKEYPath = resolve(".admin_key");
        if (existsSync(adminKEYPath)) {
          serverInterface.logger.warn("loading static ADMIN_KEY from [%s]", relative(process.cwd(), adminKEYPath));
          cache.set(ADMIN_EDITOR_AUTH_KEY, readFileSync(adminKEYPath).toString().trim());
        } else {
          cache.set(ADMIN_EDITOR_AUTH_KEY, randomUUID());
        }
      }
    }
  },
  start: (serverInterface: ServerInterface, adminInterface: EditorAdminInterface) => {
    //console.dir(server);
    const cache = (adminInterface ? adminInterface.getCache() : serverInterface.cache);
    if (!cache.has(ADMIN_EDITOR_BROWSER_OPEN_KEY)) {

      const KEY = cache.get(ADMIN_EDITOR_AUTH_KEY);

      const adminPath = `${BASEEDITOR_PATH}?${ADMIN_EDITOR_AUTH_QUERY}=${KEY}`;

      if (serverInterface?.isPrimaryWorker()) {
        serverInterface.logger.log("\n\n\tADMIN_EDITOR\n\n\t%s\n\n", adminPath);
      }

      //const DEFAULT_OPEN = process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open";

      //const OPEN = process.env["BROWSER"] ? process.env["BROWSER"] === "none" ? false : process.env["BROWSER"] : DEFAULT_OPEN;

      if (serverInterface.isPrimaryWorker()) {
        cache.set(ADMIN_EDITOR_BROWSER_OPEN_KEY, true);
        try {
          serverInterface.openBrowser(`${BASEEDITOR_PATH}?${ADMIN_EDITOR_AUTH_QUERY}=${KEY}`);
          //serverInterface.logger.log(`${OPEN} "${adminPath}"`);
          //execSync(`${OPEN} "${adminPath}"`);
        } catch (e) {
          serverInterface.logger.error(e.message);
        }
      }
    }
  }
} as ServerConfig;
