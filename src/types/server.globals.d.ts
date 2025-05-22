import "./jsx.globals.js";

import { Logger } from "./@miqro/core/lib.js";
import { request } from "./@miqro/request/lib.js";
import { RuntimeHTMLElement, Runtime, RuntimeContainer, RuntimeURL, RuntimeOptions, RuntimeShadowRootInit } from "./@miqro/jsx.js";
import { ServerGlobal } from "./miqro.js";

declare global {
  // only available server side
  var server: ServerGlobal;

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
