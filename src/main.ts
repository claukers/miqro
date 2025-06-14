#!/usr/bin/env node

import { Arguments, parseArguments } from "./common/arguments.js";
import { EXIT_CODES } from "./common/constants.js";
import { testMain } from "./bin/test.js";
import { compileSH } from "./bin/compile.js";
import { installTypings } from "./bin/types.js";
import { generateDocs } from "./bin/generate-doc.js";
import { Miqro } from "./services/app.js";
import { TEST_SOCKET } from "./common/paths.js";
import { Logger } from "@miqro/core";

async function main(args: Arguments) {
  if (args.installTypes || args.installTSConfig || args.installMiqroJSON) {
    await installTypings(args, new Logger(""));
    process.exit(EXIT_CODES.NORMAL_EXIT);
  } else {
    const app = new Miqro({
      editor: args.editor,
      name: args.name ? args.name : undefined,
      port: args.test ? TEST_SOCKET : args.port,
      services: args.services,
      browser: args.browser,
      logFile: args.logFile,
      hotreload: args.test ? false : args.hotreload,
      https: args.test ? false : args.https,
      serverOptions: args.serverOptions,
      httpRedirect: args.test ? undefined : args.httpsRedirect
    });
    // check arguments
    if (args.generateDoc) {
      // --generate-doc
      const inflated = await app.inflate();
      await generateDocs(args, app.logger, inflated);
      process.exit(EXIT_CODES.NORMAL_EXIT);
    } else if (args.migrateUp || args.migrateDown) {
      // --migration-up and --migradtion-down
      await app.migrate({
        direction: args.migrateUp ? "up" : "down"
      });
      await app.dbManager.closeAll();
      await app.dbManager.deleteAll();
      await app.webSocketManager.disconnectAll();
      process.exit(EXIT_CODES.NORMAL_EXIT);
    } else if (args.test) {
      // --test
      await app.inflate();
      await app.start();
      await testMain(app);
      await app.stop();
      await app.dbManager.closeAll();
      await app.webSocketManager.disconnectAll();
      process.exit(EXIT_CODES.NORMAL_EXIT);
    } else if (args.compile) {
      // --compile
      await app.inflate({
        inflateDir: args.inflateDir,
        inflateSea: true,
        inflateParallel: args.inflateParallel
      });
      await app.dbManager.closeAll();
      await app.webSocketManager.disconnectAll();
      await compileSH(args);
      process.exit(EXIT_CODES.NORMAL_EXIT);
    } else if (args.inflate) {
      // --inflate and --inflate-sea
      // loadApp with inflateDir arg to inflate inflatable files
      await app.inflate({
        inflateDir: args.inflateDir,
        inflateSea: args.inflateSEA,
        inflateParallel: args.inflateParallel
      });
      await app.dbManager.closeAll();
      await app.webSocketManager.disconnectAll();
      process.exit(EXIT_CODES.NORMAL_EXIT);
    } else {
      // server
      await app.inflate();
      await app.start();
    }
  }
}

try {
  // parse args
  main(parseArguments()).catch(e => {
    console.error(e);
    process.exit(EXIT_CODES.ABNORMAL);
  });
} catch (e) {
  console.error(e);
  console.error(e.message);
  process.exit(EXIT_CODES.ABNORMAL);
}
