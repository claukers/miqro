import "./globals.js";
import { Database, Migration } from "@miqro/query/lib.js";
import { CORSOptions, LogLevel, LoggerTransportWriteArgs, Request, Response, WebSocketServer, Logger, WebSocketServerOptions, SessionHandlerOptions, RouteOptions, Handler } from "@miqro/core/lib.js";
import { ParserInterface } from "@miqro/parser/lib.js";

/*export * from "@miqro/core/lib.js";
export * from "@miqro/query/lib.js";*/

export interface AuthConfig extends SessionHandlerOptions {

}

export interface CORSConfig extends CORSOptions {

}

export interface WSConfig extends WebSocketServerOptions {
  path: string;
  disabled?: boolean;
}

export interface ServerConfig {
  start?: (server: ServerInterface) => Promise<void> | void;
  preload?: (server: ServerInterface) => Promise<void> | void;
  load?: (server: ServerInterface) => Promise<void> | void;
  unload?: (server: ServerInterface) => void;
  stop?: (server: ServerInterface) => void;
}

export interface DBConfig {
  dialect?: string;
  storage?: string;
  url?: string;
  disabled?: boolean;
  name: string;
}

export interface CacheInterface {
  get<T = any>(key: string): T | undefined;
  set: (key: string, value: unknown) => void;
  unset: (key: string) => void;
  has: (key: string) => boolean;

  set_add: (key: string, value: unknown) => void;
  set_delete: (key: string, value: unknown) => void;
  set_has: (key: string, value: unknown) => boolean;
  set_clear: (key: string) => void;

  array_push: (key: string, value: unknown) => void;
  array_clear: (key: string) => void;
}

export interface APIOptions extends Partial<RouteOptions> {
  basePath?: string;
  path?: string | string[];
  method?: string | string[];
  parser?: ParserInterface;
  middleware?: Handler | Handler[];
  session?: SessionHandlerOptions | Handler;
}

export interface NamedMigration {
  name: string;
  service: string;
  dbName: string;
}

export interface LogConfig {
  level?: LogLevel;
  replaceConsoleTransport?: boolean;
  replaceFileTransport?: boolean;
  write: (args: LoggerTransportWriteArgs) => Promise<void> | void;
}

export interface MigrateOptions {
  direction: "up" | "down";
  service?: string;
  dbName?: string;
  name?: string;
}

export interface ServerInterface {
  // null values are if the feature has been disabled
  db: {
    get(name: string): Database | null;
    getMigrations(): NamedMigration[];
    migrate(options?: MigrateOptions): Promise<void>;
  },
  ws: {
    get(path: string): WebSocketServer | undefined;
    disconnectAll(path: string): void;
  };
  cache: CacheInterface;
  localCache: CacheInterface;
  logger: Logger;
  isPrimaryWorker: () => boolean;
  openBrowser: (path: string) => void;
  getLogger: (identifier: string, options?: { level?: any; transports?: any[]; formatter?: any; }) => Logger;
}

export interface ServerRequest extends Request {
  server?: ServerInterface;
}

export interface ServerResponse extends Response {
}

export { App, LoggerHandler, Router } from "@miqro/core/lib.js";
export { migration } from "@miqro/query/lib.js";
