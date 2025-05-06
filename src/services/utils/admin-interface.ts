import { EditorAdminInterface } from "../../../editor/common/admin-interface.js";
import { MigrationModule } from "../../inflate/setup-db.js";
import { Miqro } from "../app.js";
import { getHotReloadScript } from "../hot-reload.js";
import { ClusterCache } from "./cluster-cache.js";

export function createAdminInterface(app: Miqro): EditorAdminInterface {
  const adminCache = new ClusterCache("EditorCache[" + app.options.name + "]");
  return {
    getCache: () => adminCache,
    stop: () => app.stop(),
    restart: () => app.restart(),
    reload: () => app.reload(),
    getHotReloadHTML: getHotReloadScript,
    getMigrations: () => {
      if (app.inflated) {
        const ret: MigrationModule[] = [];
        for (const db of app.inflated.dbList) {
          for (const m of db.migrations) {
            ret.push(m);
          }
        }
        return ret;
      }
      return [];
    },
    getServices: () => {
      return app.options.services;
    },
    getRouteFileMap: () => {
      return app.inflated ? app.inflated.fileMap : {};
    },
    getInflateErrors: () => {
      return app.inflated ? app.inflated.errors : [];
    }
  }
}
