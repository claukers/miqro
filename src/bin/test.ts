#!/usr/bin/env node

import { RequestOptions, request as reqlRequest } from "@miqro/request";
import { resetGlobals, runTests } from "@miqro/test/dist/runner/common.js";
import { getServicePath, TEST_SOCKET } from "../common/paths.js";
import { createNodeRuntime } from "@miqro/jsx-node";
import { RuntimeOptions, RuntimeShadowRootInit, RuntimeURL } from "@miqro/jsx";
import { EXIT_CODES } from "../common/constants.js";
import { Miqro } from "../services/app.js";
import { setupTests } from "../inflate/setup-test.js";
import { ImportJSXFileOptions } from "../common/jsx.js";

export async function testMain(app: Miqro, options: ImportJSXFileOptions) {
  const startMS = Date.now();
  //resetTests();
  resetGlobals();
  //const testLogger = getLogger("test");
  globalThis.test = {
    PORT: TEST_SOCKET,
    request: (request: RequestOptions) => reqlRequest({
      ...request,
      socketPath: TEST_SOCKET
    }),
    logger: app.logger,
    sleep: async (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
    jsx: {
      createRuntime: createNodeRuntime,
      test: (cb, args: {
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
      }) => {
        return async () => {
          const runtime = createNodeRuntime(args.runtimeOptions);
          const root = runtime.createElement("root");
          const container = runtime.createContainer(root, args.containerOptions);
          await cb(container, root, runtime);
          container.disconnect();
        }
      }
    }
  }

  for (const service of app.options.services) {
    const servicePath = getServicePath(service);
    await setupTests(app.logger, servicePath, options);
  }

  console.log("");
  app.logger.log("===starting tests===");
  console.log("");

  const ret = await runTests(undefined, app.logger);

  console.log("");
  app.logger.log("===tests ended===");
  if (ret.failed.length > 0) {
    console.log("");
    app.logger.error("===failed tests===");
    console.log("");
  }

  const took = Date.now() - startMS;
  ret.failed.forEach(e => {
    app.logger.error("\x1b[31m%s\x1b[0m", e.fullName);
    app.logger.error(e.error);
  });


  console.log("");
  app.logger.log(ret.passed + " tests passed");
  if (ret.failed.length > 0) {
    app.logger.error(ret.failed.length + " failed");
  } else {
    app.logger.log(ret.failed.length + " failed");
  }

  app.logger.log("took " + took + "ms");

  if (ret.failed.length > 0) {
    process.exit(EXIT_CODES.TEST_FAILED);
  }
  await app.dbManager.closeAll();
}
