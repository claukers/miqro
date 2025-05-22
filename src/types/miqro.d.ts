import "./globals.js";
import { Database, Migration } from "@miqro/query/lib.js";
import { ReadBuffer, URLEncodedParser, JSONParser, TextParser, CORS, SessionHandler } from "@miqro/core/lib.js";
import { ErrorHandler, HandlerWithOptions, CORSOptions, LogLevel, LoggerTransportWriteArgs, Request, Response, WebSocketServer, Logger, WebSocketServerOptions, SessionHandlerOptions, RouteOptions, Handler } from "@miqro/core/lib.js";
import { ParserInterface } from "@miqro/parser/lib.js";
import { ProtectedHeaderParameters, EncryptOptions, SignOptions, JWTPayload, JWTDecryptOptions, JWTDecryptResult, JWTVerifyResult, JWTVerifyOptions } from "jose/types/index.js";
import { KeyObject } from "node:crypto";

/*export * from "@miqro/core/lib.js";
export * from "@miqro/query/lib.js";*/

export interface AuthConfig extends SessionHandlerOptions {

}

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
  newClusterCache: (name: string, logger?: Logger) => CacheInterface;
  newLocalCache: (name: string, logger?: Logger) => CacheInterface;
  createSecretKey: (key: string, encoding: BufferEncoding) => KeyObject;
  getWorkerCount: () => number;
  getWorkerNumber: () => number;
  isPrimaryWorker: () => boolean;
  jwt: {
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
}

export interface MiddlewareConfig {
  middleware?: Array<HandlerWithOptions | Handler>;
  post?: Array<HandlerWithOptions | Handler>;
}

export interface CORSConfig extends CORSOptions {

}

export interface ErrorConfig {
  catch?: Array<ErrorHandler>;
}

export interface WSConfig extends WebSocketServerOptions {
  path: string;
  disabled?: boolean;
}

export interface DocConfig {
  publish: {
    [path: string]: {
      type?: "HTML" | "MD" | "JSON",
      all?: boolean;
    }
  }
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

export interface ServerInterface extends ServerGlobal{
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

export { App, LoggerHandler, Router, APIRoute } from "@miqro/core/lib.js";
export { migration, Migration } from "@miqro/query/lib.js";
