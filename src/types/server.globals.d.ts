import "./jsx.globals.js";

import { Logger, WebSocketServer, ReadBuffer, URLEncodedParser, JSONParser, TextParser, CORS, SessionHandler } from "@miqro/core/lib.js";
import { request } from "./@miqro/request.js";
import { RuntimeHTMLElement, Runtime, RuntimeContainer, RuntimeURL, RuntimeOptions, RuntimeShadowRootInit } from "./@miqro/jsx.js";
import { KeyObject } from "node:crypto";
import { JWTDecryptOptions, JWTDecryptResult, JWTPayload, JWTVerifyOptions, JWTVerifyResult, ProtectedHeaderParameters } from "jose/types/index.js";
import { EncryptJWTOptions, JWTSignOptions } from "./miqro.js";

declare global {
  // only available server side
  var server: {
    /*// null values are if the feature has been disabled
    db: {
      get(name: string): Database | null;
    },
    ws: {
      get(path: string): WebSocketServer | undefined;
      disconnectAll(path: string): void;
    };
    cache: {
      get: (key: string) => any;
      set: (key: string, value: unknown) => void;
      delete: (key: string) => void;
      has: (key: string) => boolean;
    };
    logger: Logger;*/
    middleware: {
      buffer: typeof ReadBuffer;
      url: typeof URLEncodedParser;
      json: typeof JSONParser;
      text: typeof TextParser;
      cors: typeof CORS;
      session: typeof SessionHandler;
    }
    encodeHTML: (str: string) => string;
    inflateMDtoHTML: (str: string) => string;
    createSecretKey: (key: string, encoding: BufferEncoding) => KeyObject;
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

  var test: {
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

  var it: Function;
  var describe: Function;
  var before: Function;
  var after: Function;
}
