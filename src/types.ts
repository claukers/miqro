import { Database } from "@miqro/query";
import { WebSocketServerOptions, SessionHandlerOptions, Logger, WebSocketServer, ReadBuffer, URLEncodedParser, JSONParser, TextParser, CORS, SessionHandler, RouteOptions, Handler, Request, Response, LogLevel, LoggerTransportWriteArgs, CORSOptions, HandlerWithOptions, ErrorHandler, SchemaProperties, APIRoute as BaseAPIRoute, TypedRequest, defineRoute as baseDefineRoute } from "@miqro/core";
import { request } from "@miqro/request";
import { Parser, ParserInterface } from "@miqro/parser";
import { RuntimeHTMLElement, Runtime, RuntimeContainer, RuntimeURL, RuntimeOptions, RuntimeShadowRootInit } from "@miqro/jsx";
import { EncryptOptions, JWTDecryptOptions, JWTDecryptResult, JWTPayload, JWTVerifyOptions, JWTVerifyResult, ProtectedHeaderParameters, SignOptions } from "jose";
import { KeyObject } from "node:crypto";

export interface EncryptJWTOptions {
  alg?: string;
  enc?: string;
  iat?: number | string | Date;
  iss?: string;
  aud?: string;
  exp?: number | string | Date;
  options?: EncryptOptions;
}

export interface JWTSignOptions {
  alg?: string;
  iat?: number | string | Date;
  iss?: string;
  aud?: string;
  exp?: number | string | Date;
  options?: SignOptions;
}

export type APIRoute<
  TBody extends SchemaProperties | string | boolean | undefined = undefined,
  TParams extends SchemaProperties | string | boolean | undefined = undefined,
  TQuery extends SchemaProperties | string | boolean | undefined = undefined>
  = BaseAPIRoute<ServerRequest, TBody, TParams, TQuery>;

export function defineRoute<
  const TBody extends SchemaProperties | string | boolean | undefined = undefined,
  const TParams extends SchemaProperties | string | boolean | undefined = undefined,
  const TQuery extends SchemaProperties | string | boolean | undefined = undefined
>(route: APIRoute<TBody, TParams, TQuery>) {
  return baseDefineRoute<ServerRequest, TBody, TParams, TQuery>(route) as APIRoute;
}

export { Migration } from "@miqro/query";

export interface JWTInterface {
  createSecretKey: (key: string, encoding: BufferEncoding) => KeyObject;
  /**
 * creates a JWT encrypted token with jose
 * 
 * @param payload the payload to encrypt
 * @param secret the secret example. const secret = createSecretKey(process.env.JWT_SECRET, 'utf-8');
 * @param options options like expiratation date, issuer and audience
 * @returns 
 */
  encrypt: (payload: JWTPayload, secret: KeyObject, options?: Partial<EncryptJWTOptions>) => Promise<string>
  /**
   * decrypts a JWT token with jose
   * @param jwt the JWT token
   * @param secret the secret example. const secret = createSecretKey(process.env.JWT_SECRET, 'utf-8');
   * @param options options like issuer and audience
   * @returns 
   */
  decrypt: <PayloadType = JWTPayload>(jwt: string, secret: KeyObject, options?: Partial<JWTDecryptOptions>) => Promise<JWTDecryptResult<PayloadType>>;
  /**
   * verify a JWT token with jose
   * @param jwt the JWT token
   * @param secret the secret example. const secret = createSecretKey(process.env.JWT_SECRET, 'utf-8');
   * @param options options like issuer and audience
   * @returns 
   */
  verify: <PayloadType = JWTPayload>(jwt: string, secret: KeyObject, options?: Partial<JWTVerifyOptions>) => Promise<JWTVerifyResult<PayloadType>>;
  /**
   * creates a signed JWT with jose
   * 
   * @param payload the payload to encrypt
   * @param secret the secret example. const secret = createSecretKey(process.env.JWT_SECRET, 'utf-8');
   * @param options options like expiratation date, issuer and audience
   * @returns 
   */
  sign: (payload: JWTPayload, secret: KeyObject, options?: Partial<JWTSignOptions>) => Promise<string>;
  /**
   * decodes a protected header with jose
   * @param token 
   * @returns 
   */
  decodeProtectedHeader: (token: string | object) => ProtectedHeaderParameters;
  /**
   * decodes a jwt token
   * @param jwt 
   * @returns 
   */
  decode: <PayloadType = JWTPayload>(jwt: string) => PayloadType & JWTPayload;
}

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
  newParser(): Parser;
  newClusterCache: (name: string, logger?: Logger) => CacheInterface;
  newLocalCache: (name: string, logger?: Logger) => CacheInterface;

  getWorkerCount: () => number;
  getWorkerNumber: () => number;
  isPrimaryWorker: () => boolean;
  jwt: JWTInterface;
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

export interface ServerInterface extends ServerGlobal {
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
  openBrowser: (path: string) => void;
  getLogger: (identifier: string, options?: { level?: any; transports?: any[]; formatter?: any; }) => Logger;
  stop: () => Promise<void>;
  reload: () => Promise<null | {
    filePath: string;
    error: Error;
  }[]>;
  restart: () => Promise<null | {
    filePath: string;
    error: Error;
  }[]>;
}

export interface ServerRequest extends Request {
  server: ServerInterface;
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

/*declare global {
  // only available server side
  var server: ServerGlobal;

  //var utils: UtilsGlobal;

  var test: TestHelperGlobal;

  var it: Function;
  var describe: Function;
  var before: Function;
  var after: Function;
}*/

export interface AuthConfig extends SessionHandlerOptions {

}

export interface MiddlewareConfig {
  middleware?: Array<HandlerWithOptions | Handler>;
  post?: Array<HandlerWithOptions | Handler>;
}

export interface ErrorConfig {
  catch?: Array<ErrorHandler>;
}

export interface DocConfig {
  publish: {
    [path: string]: {
      type?: "HTML" | "MD" | "JSON",
      all?: boolean;
    }
  }
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

export interface APIOptions<
  TBody extends SchemaProperties | string | boolean | undefined = SchemaProperties | string | boolean | undefined,
  TParams extends SchemaProperties | string | boolean | undefined = SchemaProperties | string | boolean | undefined,
  TQuery extends SchemaProperties | string | boolean | undefined = SchemaProperties | string | boolean | undefined
> extends Partial<RouteOptions<TBody, TParams, TQuery>> {
  basePath?: string;
  path?: string | string[];
  method?: string | string[];
  parser?: ParserInterface;
  middleware?: Handler | Handler[];
  session?: SessionHandlerOptions | Handler;
}