import { RouterHandlerOptions } from "@miqro/core";
import { CacheInterface, ServerRequest } from "../../src/types.js";
import { MigrationModule } from "../../src/inflate/setup-db.js";

export interface EditorAdminInterface {
  getCache: () => CacheInterface;
  //inflateJSX: (path: string, minify?: boolean) => Promise<string>;
  getMigrations(): MigrationModule[];
  stop: () => Promise<void>;
  reload: () => Promise<null | {
    filePath: string;
    error: Error;
  }[]>;
  restart: () => Promise<null | {
    filePath: string;
    error: Error;
  }[]>;
  getHotReloadHTML(): string;
  getInflateErrors(): null | {
    filePath: string;
    error: Error;
  }[];
  getServices(): string[];
  getRouteFileMap(): {
    [filePath: string]: {
      routes: {
        path?: string;
        method?: string | null;
        options?: RouterHandlerOptions;
        inflatePath?: string;
      }[];
      previewMethod: "api" | "html" | null;
    }
  };
}

export interface AdminRequest extends ServerRequest {
  editor?: EditorAdminInterface;
}

/*let currentAdminInterface: EditorAdminInterface | null = null;
function createFakeAdminInterface(server: any): EditorAdminInterface {
  return {
    getCache: () => {
      return server.cache;
    },
    stop: async () => {

    },
    restart: async () => {
      return null;
    },
    reload: async () => {
      return null;
    },
    getHotReloadHTML: () => {
      return "";
    },
    getMigrations: () => {
      return [];
    },
    getServices: () => {
      return ["."];
    },
    getRouteFileMap: () => {
      return {};
    },
    getInflateErrors: () => {
      return [];
    },
    inflateJSX: async function inflateJSX(path, minify: boolean = true) {
      return "";
    }
  }
}

export function getEditorAdmin(server): EditorAdminInterface {
  return currentAdminInterface ? currentAdminInterface : createFakeAdminInterface(server);
}

export function setEditorAdmin(admin: EditorAdminInterface): void {
  currentAdminInterface = admin;
}*/

