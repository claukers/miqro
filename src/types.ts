import { Database } from "@miqro/query";
import { WebSocketServerOptions, SessionHandlerOptions, Logger, WebSocketServer, ReadBuffer, URLEncodedParser, JSONParser, TextParser, CORS, SessionHandler, RouteOptions, Handler, Request, Response, LogLevel, LoggerTransportWriteArgs, CORSOptions, HandlerWithOptions, ErrorHandler } from "@miqro/core";
import { request } from "@miqro/request";
import { ParserInterface } from "@miqro/parser";
import { RuntimeHTMLElement, Runtime, RuntimeContainer, RuntimeURL, RuntimeOptions, RuntimeShadowRootInit } from "@miqro/jsx";
import {
  RuntimeElementDefinitionOptions,
  Component,
  createElement,
  Fragment,
  enableDebugLog
} from "@miqro/jsx";
import * as jsxLib from "@miqro/jsx";

declare global {
  // jsx only for the default value of tsconfig.json
  //var React: {};
  var JSX: {
    createElement: typeof createElement;
    Fragment: typeof Fragment;
    enableDebugLog: typeof enableDebugLog;
  }
}

declare global {
  // only available browser side
  var jsx: {
    define: (tagName: string, component: Component, options?: RuntimeElementDefinitionOptions) => void;
    useRuntime: typeof jsxLib.useRuntime;
    usePathname: typeof jsxLib.usePathname;
    Link: typeof jsxLib.Link;
    Router: typeof jsxLib.Router;
    createContext: typeof jsxLib.createContext;
    useContext: typeof jsxLib.useContext;
    useState: typeof jsxLib.useState;
    useEffect: typeof jsxLib.useEffect;
    useQuery: typeof jsxLib.useQuery;
    useRef: typeof jsxLib.useRef;
    useElement: typeof jsxLib.useElement;
    useRefresh: typeof jsxLib.useRefresh;
  }
}

export { APIRoute } from "@miqro/core";
export { Migration } from "@miqro/query";

export interface ServerGlobal {
  encodeHTML: (str: string) => string;
  inflateMDtoHTML: (str: string) => string;
  middleware: {
    buffer: typeof ReadBuffer;
    url: typeof URLEncodedParser;
    json: typeof JSONParser;
    text: typeof TextParser;
    cors: typeof CORS;
    session: typeof SessionHandler;
  };
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

export interface NamedMigration {
  name: string;
  service: string;
  dbName: string;
}

export interface MigrateOptions {
  direction: "up" | "down";
  service?: string;
  dbName?: string;
  name?: string;
}

export interface LogConfig {
  level?: LogLevel;
  replaceConsoleTransport?: boolean;
  replaceFileTransport?: boolean;
  write: (args: LoggerTransportWriteArgs) => Promise<void> | void;
}

export interface ServerInterface {
  // null values are if the feature has been disabled
  db: {
    get(name: string): Database | null;
    getMigrations(): NamedMigration[];
    migrate(options: MigrateOptions): Promise<void>;
  },
  ws: {
    get(path: string): WebSocketServer | undefined;
    disconnectAll(path: string): void;
  };
  cache: CacheInterface;
  localCache: CacheInterface;
  logger?: Logger;
  isPrimaryWorker: () => boolean;
  getWorkerNumber: () => number;
  getWorkerCount: () => number;
  openBrowser: (path: string) => void;
  getLogger: (identifier: string, options?: { level?: any; transports?: any[]; formatter?: any; }) => Logger;
}

export interface ServerRequest extends Request {
  server?: ServerInterface;
}

export interface ServerResponse extends Response {
}

export interface TestHelperGlobal {
  PORT: string;
  request: typeof request,
  logger: Logger,
  sleep: (ms: number) => Promise<void>,
  jsx: {
    createRuntime: (args?: {
      basePath?: string | null;
      url?: RuntimeURL;
      logger?: {
        log: Function,
        error: Function
      }
    }) => Runtime;
    test: (cb: (container: RuntimeContainer, root: RuntimeHTMLElement, runtime: Runtime) => (Promise<void> | void), args?: {
      runtimeOptions?: {
        basePath?: string | null;
        url?: RuntimeURL;
        logger?: {
          log: Function;
          error: Function;
        };
      },
      containerOptions?: {
        runtimeOptions?: RuntimeOptions;
        shadowInit?: boolean | RuntimeShadowRootInit;
      };
    }) => () => Promise<void>;
  }
}

declare global {
  // only available server side
  var server: ServerGlobal;

  //var utils: UtilsGlobal;

  var test: TestHelperGlobal;

  var it: Function;
  var describe: Function;
  var before: Function;
  var after: Function;
}

export interface AuthConfig extends SessionHandlerOptions {

}

export interface MiddlewareConfig {
  middleware?: Array<HandlerWithOptions | Handler>;
  post?: Array<HandlerWithOptions | Handler>;
}

export interface ErrorConfig {
  catch: Array<ErrorHandler>;
}

export interface WSConfig extends WebSocketServerOptions {
  path: string;
  disabled?: boolean;
}

export interface CORSConfig extends CORSOptions {

}

export interface ServerConfig {
  preload?: (server: ServerInterface) => Promise<void> | void;
  start?: (server: ServerInterface) => Promise<void> | void;
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

export interface APIOptions extends Partial<RouteOptions> {
  basePath?: string;
  path?: string | string[];
  method?: string | string[];
  parser?: ParserInterface;
  middleware?: Handler | Handler[];
  session?: SessionHandlerOptions | Handler;
}
