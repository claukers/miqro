import "./jsx.globals.js";

import { Logger, WebSocketServer, ReadBuffer, URLEncodedParser, JSONParser, TextParser, CORS, SessionHandler } from "@miqro/core/lib.js";
import { request } from "./@miqro/request.js";
import { RuntimeHTMLElement, Runtime, RuntimeContainer, RuntimeURL, RuntimeOptions, RuntimeShadowRootInit } from "./@miqro/jsx.js";

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
