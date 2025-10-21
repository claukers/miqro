import { checkEnvVariable } from "@miqro/core";
import { cp, existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { cwd, env, platform, arch } from "node:process";

import { EXIT_CODES } from "./constants.js";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { BIN_NAME, help, usage } from "./help.js";
import { getMiqroJSONPath, TEST_SOCKET } from "./paths.js";
import { isSea } from "node:sea";
import cluster from "node:cluster";
import { __package_dirname, getVersion } from "./assets.js";
import { Parser, Schema } from "@miqro/parser";
import { ServerOptions } from "node:https";

const parser = new Parser();

interface MiqroJSON {
  services?: string[];
  port?: string | number;
  inflateDir?: string;
  name?: string;
  browser?: string | boolean;
  logFile?: string | boolean;
  editor?: boolean;
  https?: boolean;
  serverOptions?: ServerOptions;
  httpsRedirect?: number;
  inflateParallel?: number;
  noBuild?: boolean;
  noMinify?: boolean;
  inflateOnlyAssets?: boolean;
  inflateFlat?: boolean;
}

const MiqroJSONSchema: Schema<MiqroJSON> = {
  type: "object",
  properties: {
    name: "string?",
    services: "string[]?",
    noBuild: "boolean?",
    noMinify: "boolean?",
    inflateOnlyAssets: "boolean?",
    inflateFlat: "boolean?",
    port: "number?|string?",
    inflateDir: "string?",
    browser: "boolean?|string?",
    logFile: "boolean?|string?",
    editor: "boolean?",
    https: "boolean?",
    serverOptions: "any?",
    httpsRedirect: "number?",
    inflateParallel: "number?"
  }
}

export function importMiqroJSON(inFile: string) {
  const mod = JSON.parse(readFileSync(inFile).toString());
  const module = parser.parse(mod, MiqroJSONSchema, basename(inFile));
  if (module !== undefined) {
    return module as MiqroJSON;
  } else {
    throw new Error(`error loading [${inFile}] undefined`);
  }
}

export function getPORT() {
  return checkEnvVariable("PORT", "8080");
}

export interface Arguments {
  inflateOnlyAssets?: boolean;
  inflateFlat?: boolean;
  name?: string;
  noBuild?: boolean;
  noMinify?: boolean;
  browser?: string | boolean;
  logFile?: string | boolean;
  // installTypes: boolean;
  installMiqroJSON: boolean;
  installTSConfig: boolean;
  install: boolean;
  test: boolean;
  port: string;
  inflate: boolean;
  generateDoc: boolean;
  generateDocOut: string;
  miqroJSONPath: string | false;
  disableMiqroJSON: boolean;
  generateDocAll: boolean;
  generateDocType: "JSON" | "MD";
  migrateUp: boolean;
  migrateDown: boolean;
  compile: boolean;
  inflateSEA: boolean;
  inflateDir: string;
  services: string[];
  editor: boolean;
  hotreload: boolean;
  watch: boolean;
  https: boolean;
  serverOptions: ServerOptions;
  httpsRedirect?: number;
  inflateParallel?: number;
}

/**
 * parse process.argv arguments 
 */
export function parseArguments(): Arguments {
  //env["LOG_FILE"] = env["LOG_FILE"] ? env["LOG_FILE"] : "./server.log";


  const args = cluster.isPrimary ? process.argv.slice(2, process.argv.length) : process.argv.slice(3, process.argv.length);
  const flags: {
    inflateParallel: number | null;
    httpsRedirect: number | null;
    https: boolean | null;
    serverOptions: ServerOptions;
    logFile: string | boolean | null;
    browser: string | boolean | null;
    name: string | null;
    // installTypes: boolean | null;
    installMiqroJSON: boolean | null;
    installTSConfig: boolean | null;
    install: boolean | null;
    inflate: boolean | null;
    port: string | null;
    generateDoc: boolean | null;
    generateDocAll: boolean | null;
    miqroJSONPath: string | null;
    disableMiqroJSON: boolean | null;
    generateDocOut?: string | null;
    generateDocType?: string | null;
    test: boolean;
    migrateUp: boolean | null;
    migrateDown: boolean | null;
    compile: boolean | null;
    inflateSEA: boolean | null;
    editor: boolean | null;
    inflateDir?: string | null;
    hotreload?: boolean | null;
    watch?: boolean | null;
    noBuild?: boolean | null;
    noMinify?: boolean | null;
    inflateOnlyAssets?: boolean | null;
    inflateFlat?: boolean | null;
  } = {
    inflateFlat: null,
    inflateOnlyAssets: null,
    inflateParallel: null,
    httpsRedirect: null,
    https: null,
    serverOptions: {},
    name: null,
    browser: null,
    logFile: null,
    hotreload: null,
    watch: null,
    miqroJSONPath: null,
    installMiqroJSON: null,
    install: null,
    disableMiqroJSON: null,
    // installTypes: null,
    port: null,
    installTSConfig: null,
    migrateUp: null,
    migrateDown: null,
    inflateSEA: null,
    compile: null,
    noBuild: null,
    noMinify: null,
    test: null,
    inflate: null,
    generateDoc: null,
    generateDocAll: null,
    generateDocOut: null,
    generateDocType: null,
    editor: null,
    inflateDir: null
  };
  const services: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const argument = args[i];
    switch (argument) {
      case "-v":
      case "--version":
        const { VERSION, NODE_VERSION, ESBUILD_VERSION } = getVersion();
        if (isSea()) {
          console.log("version [%s]", VERSION);
          console.log("Node.js version [%s]", NODE_VERSION);
          console.log("esbuild version [%s]", ESBUILD_VERSION);
          console.log("platform [%s-%s]", platform, arch);
        } else {
          const packageJSON = JSON.parse(readFileSync(resolve(__package_dirname, "package.json")).toString());
          const VERSION = packageJSON.version;
          console.log("version [%s]", VERSION);
        }
        process.exit(EXIT_CODES.NORMAL_EXIT);
      case "-h":
      case "--help":
        console.log(usage);
        console.log(help);
        process.exit(EXIT_CODES.NORMAL_EXIT);
      case "--disable-miqrojson":
        if (flags.disableMiqroJSON !== null || flags.miqroJSONPath !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.disableMiqroJSON = true;
        continue;
      case "--config":
        if (flags.miqroJSONPath !== null || flags.disableMiqroJSON !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        if (typeof args[i + 1] !== "string") {
          console.error("bad arguments. --config must be a string.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        } else {
          const cPath = String(args[i + 1]) as any;
          flags.miqroJSONPath = cPath;
        }
        i++;
        continue;
      case "--inflate-only-assets":
        if (flags.inflateOnlyAssets !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.inflateOnlyAssets = true;
        continue;
      case "--inflate-flat":
        if (flags.inflateFlat !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.inflateFlat = true;
        continue;
      case "--no-minify":
        if (flags.noMinify !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.noMinify = true;
        continue;
      case "--no-build":
        if (flags.noBuild !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.noBuild = true;
        continue;
      case "--install-tsconfig":
        if (flags.inflate !== null || flags.installTSConfig !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.installTSConfig = true;
        continue;
      case "--install":
        if (flags.inflate !== null || flags.installTSConfig !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.install = true;
        continue;
      case "--watch":
        if (flags.watch !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.watch = true;
        continue;
      case "--hot-reload":
        if (flags.hotreload !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.hotreload = true;
        continue;
      case "--https":
        if (flags.https !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.https = true;
        continue;
      case "--https-redirect":
        if (flags.httpsRedirect !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        const httpsRedirectPort = parseInt(String(args[i + 1]) as any, 10);
        if (isNaN(httpsRedirectPort)) {
          console.error("bad arguments. --https-redirect must be a number.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.httpsRedirect = httpsRedirectPort;
        i++;
        continue;
      case "--https-cert":
        if (flags.serverOptions.cert) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        const httpsCertPath = args[i + 1] as any;
        if (typeof httpsCertPath !== "string") {
          console.error("bad arguments. --https-cert must be a string.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.serverOptions.cert = readFileSync(httpsCertPath);
        i++;
        continue;
      case "--https-key":
        if (flags.serverOptions.key) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        const httpsKeyPath = args[i + 1] as any;
        if (typeof httpsKeyPath !== "string") {
          console.error("bad arguments. --https-key must be a string.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.serverOptions.key = readFileSync(httpsKeyPath);
        i++;
        continue;
      case "--port":
        if (flags.port !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        if (typeof args[i + 1] !== "string") {
          console.error("bad arguments. --port must be a string.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        } else {
          const cPort = String(args[i + 1]) as any;
          flags.port = cPort;
        }
        i++;
        continue;
      case "--name":
        if (flags.name !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        if (typeof args[i + 1] !== "string") {
          console.error("bad arguments. --port must be a string.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        } else {
          const cName = String(args[i + 1]).toUpperCase() as any;
          flags.name = cName;
        }

        i++;
        continue;
      case "--log-file":
        if (flags.logFile !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }

        if (typeof args[i + 1] !== "string") {
          console.error("bad arguments. --port must be a string.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        } else {
          const cLofFile = String(args[i + 1]) as any;
          flags.logFile = cLofFile;
        }
        i++;
        continue;
      case "--browser":
        if (flags.browser !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }

        if (typeof args[i + 1] !== "string") {
          console.error("bad arguments. --port must be a string.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        } else {
          const cBrowser = String(args[i + 1]) as any;
          flags.browser = cBrowser;
        }
        i++;
        continue;
      case "--generate-doc":
        if (flags.generateDoc !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.generateDoc = true;
        continue;
      case "--generate-doc-all":
        if (flags.generateDocAll !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.generateDocAll = true;
        continue;
      case "--generate-doc-out":
        if (flags.generateDocOut !== null) {
          console.error("bad arguments. --generate-doc-out already set.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.generateDocOut = args[i + 1];
        if (typeof flags.generateDocOut !== "string") {
          console.error("bad arguments. --generate-doc-out missing value.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        i++;
        continue;
      case "--generate-doc-type":
        if (flags.generateDocType !== null) {
          console.error("bad arguments. --generate-doc-type already set.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        const gDt = String(args[i + 1]).toUpperCase() as any;
        if (typeof gDt !== "string" || (gDt !== "JSON" && gDt !== "MD")) {
          console.error("bad arguments. --generate-doc-type can be json or md.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.generateDocType = gDt;
        i++;
        continue;
      case "--compile":
        if (flags.compile !== null) {
          if (flags.inflateDir === null) {
            flags.inflateDir = resolve(tmpdir(), `${BIN_NAME}-compile`, randomUUID());
          }
          console.error("bad arguments. --compile already set");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.compile = true;
        flags.inflateSEA = true;
        flags.inflate = true;
        continue;
      /*case "--install-types":
        if (flags.inflate !== null || flags.installTypes !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.installTypes = true;
        continue;*/
      case "--editor":
        if (flags.editor !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.editor = true;
        continue;
      case "--install-miqrojson":
        if (flags.installMiqroJSON !== null) {
          console.error("bad arguments. --install-miqrojson already set.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.installMiqroJSON = true;
        continue;
      case "--inflate-sea":
        if (flags.inflateSEA !== null) {
          console.error("bad arguments. --inflate-sea already set.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.inflateSEA = true;
        continue;
      case "--migrate-up":
        if (flags.migrateUp !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.migrateUp = true;
        continue;
      case "--migrate-down":
        if (flags.migrateDown !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.migrateDown = true;
        continue;
      case "--inflate":
        if (flags.inflate !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.inflate = true;
        continue;
      case "--test":
        if (flags.test !== null) {
          console.error("bad arguments.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        env["BROWSER"] = env["BROWSER"] ? env["BROWSER"] : "none";
        env["PORT"] = TEST_SOCKET;
        flags.test = true;
        continue;
      case "--service":
        if (args[i + 1] === undefined) {
          console.error("bad arguments. service directory not provided.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        services.push(args[i + 1]);
        i++;
        continue;
      case "--inflate-parallel":
        if (args[i + 1] === undefined) {
          console.error("bad arguments. service directory not provided.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        if (typeof args[i + 1] !== "string") {
          console.error("bad arguments. --inflate-parallel must be a number.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        } else {
          const cParallel = parseInt(String(args[i + 1]), 10);
          if (isNaN(cParallel)) {
            console.error("bad arguments. --inflate-parallel must be a number.");
            console.error(usage);
            process.exit(EXIT_CODES.BAD_ARGUMENTS);
          }
          flags.inflateParallel = cParallel;
        }
        i++;
        continue;
      case "--inflate-dir":
        if (flags.inflateDir !== null && flags.compile === null) {
          console.error("bad arguments. --inflate-dir already set.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        flags.inflateDir = args[i + 1];
        if (typeof flags.inflateDir !== "string") {
          console.error("bad arguments. inflate directory not provided.");
          console.error(usage);
          process.exit(EXIT_CODES.BAD_ARGUMENTS);
        }
        i++;
        continue;
      default:
        //console.error("IGNORING bad arguments. [%s]", argument);
        //continue;
        console.error("bad argument. [%s]", argument);
        console.error(usage);
        console.log(help);
        process.exit(EXIT_CODES.BAD_ARGUMENTS);
      /*flags.inflate = flags.inflate ? flags.inflate : false;
      flags.editor = flags.editor ? flags.editor : false;
      flags.inflateDir = flags.inflateDir ? flags.inflateDir : undefined;
      services.push(argument);
      continue;*/
    }
  }

  flags.inflate = flags.inflate ? flags.inflate : false;

  flags.test = flags.test ? flags.test : false;
  flags.inflateDir = flags.inflateDir ? flags.inflateDir : undefined;

  const miqroJSONPath = !flags.disableMiqroJSON ? flags.miqroJSONPath ? resolve(flags.miqroJSONPath) : getMiqroJSONPath() : false;
  const miqroRC = miqroJSONPath ? importMiqroJSON(miqroJSONPath) : {};

  //console.dir(miqroRC.serverOptions);

  // try to load .miqrorc
  if (!flags.disableMiqroJSON && miqroJSONPath) {
    if (services.length === 0) {
      if (miqroRC.services) {
        for (const service of miqroRC.services) {
          services.push(join(relative(cwd(), dirname(miqroJSONPath)), service));
        }
      }
    }
    if (flags.noBuild === null) {
      if (miqroRC.noBuild !== undefined) {
        flags.noBuild = miqroRC.noBuild;
      }
    }
    if (flags.inflateFlat === null) {
      if (miqroRC.inflateFlat !== undefined) {
        flags.inflateFlat = miqroRC.inflateFlat;
      }
    }
    if (flags.inflateOnlyAssets === null) {
      if (miqroRC.inflateOnlyAssets !== undefined) {
        flags.inflateOnlyAssets = miqroRC.inflateOnlyAssets;
      }
    }
    if (flags.noMinify === null) {
      if (miqroRC.noMinify !== undefined) {
        flags.noMinify = miqroRC.noMinify;
      }
    }
    if (flags.https === null) {
      if (miqroRC.https) {
        flags.https = miqroRC.https;
      }
    }
    if (flags.httpsRedirect === null) {
      if (miqroRC.httpsRedirect && flags.https) {
        /*console.log("reading key from " + String(miqroRC.serverOptions?.key));
        flags.serverOptions.key = readFileSync(String(miqroRC.serverOptions?.key));*/
        flags.httpsRedirect = miqroRC.httpsRedirect;
      }
    }
    if (!flags.serverOptions.key) {
      if (miqroRC.serverOptions?.key) {
        /*console.log("reading key from " + String(miqroRC.serverOptions?.key));
        flags.serverOptions.key = readFileSync(String(miqroRC.serverOptions?.key));*/
        flags.serverOptions.key = miqroRC.serverOptions?.key;
      }
    }

    if (!flags.serverOptions.cert) {
      if (miqroRC.serverOptions?.cert) {
        /*console.log("reading cert from " + String(miqroRC.serverOptions?.cert));
        flags.serverOptions.cert = readFileSync(String(miqroRC.serverOptions?.cert));*/
        flags.serverOptions.cert = miqroRC.serverOptions?.cert;
      }
    }
    if (flags.port === null) {
      if (miqroRC.port) {
        flags.port = String(miqroRC.port);
      }
    }
    if (!flags.inflateDir && flags.inflate) {
      if (miqroRC.inflateDir) {
        flags.inflateDir = join(relative(cwd(), dirname(miqroJSONPath)), miqroRC.inflateDir);
      }
    }
    if (flags.name === null) {
      if (miqroRC.name) {
        flags.name = miqroRC.name;
      }
    }
    if (flags.logFile === null) {
      if (miqroRC.logFile !== undefined) {
        flags.logFile = miqroRC.logFile;
      }
    }
    if (flags.browser === null) {
      if (miqroRC.browser !== undefined) {
        flags.browser = miqroRC.browser;
      }
    }
    if (flags.editor === null) {
      if (miqroRC.editor !== undefined) {
        flags.editor = miqroRC.editor;
      }
    }

    if (flags.inflateParallel === null) {
      if (miqroRC.inflateParallel !== undefined) {
        flags.inflateParallel = miqroRC.inflateParallel;
      }
    }
  }

  flags.editor = flags.editor ? flags.editor : false;

  if (services.length === 0 && (!flags.installTSConfig/* && !flags.installTypes*/ && !flags.installMiqroJSON)) {
    flags.inflateDir = flags.inflateDir ? flags.inflateDir : undefined;
    console.error(`bad arguments. missing --service argument`);
    console.error(usage);
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  const notDirServices = services.filter(service => existsSync(resolve(process.cwd(), service)) && !statSync(resolve(process.cwd(), service)).isDirectory());

  if (notDirServices.length > 0) {
    console.error(`bad arguments. [${notDirServices.join(",")}] are not directories.`);
    console.error(usage);
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.inflateDir && existsSync(resolve(cwd(), flags.inflateDir)) && !statSync(resolve(cwd(), flags.inflateDir)).isDirectory()) {
    console.error("bad arguments. inflate directory not a directory.");
    console.error(usage);
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (!flags.inflate && flags.inflateDir) {
    console.error("bad arguments. to use --inflate-dir you must use --inflate.");
    console.error(usage);
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.inflate === null || flags.inflateDir === null) {
    console.error("for ts");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.install && flags.inflate) {
    console.error("bad arguments. cannot use --install with --inflate");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.inflate && flags.editor) {
    console.error("bad arguments. cannot use --inflate with --editor");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.inflate && (/*flags.installTypes || */flags.installTSConfig || flags.installMiqroJSON || flags.install)) {
    console.error("bad arguments. cannot use --inflate with --install, --install-tsconfig or --install-miqrojson");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.inflateSEA && !flags.inflate) {
    console.error("bad arguments. cannot use --inflate-sea without --inflate");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.inflateFlat && !flags.inflate) {
    console.error("bad arguments. cannot use --inflate-flat without --inflate");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.inflateOnlyAssets && !flags.inflate) {
    console.error("bad arguments. cannot use --inflate-only-assets without --inflate");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.inflateOnlyAssets && flags.inflateSEA) {
    console.error("bad arguments. cannot use --inflate-only-assets with --inflate-sea");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.editor && (/*flags.installTypes || */flags.installTSConfig || flags.installMiqroJSON)) {
    console.error("bad arguments. cannot use --editor with--install-types, --install-tsconfig or --install-miqrojson");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.test && (flags.watch || flags.hotreload || flags.editor || flags.compile || flags.inflate)) {
    console.error("bad arguments. cannot use --editor with --test");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.migrateUp && (flags.watch || flags.hotreload || flags.editor || flags.compile || flags.test || flags.migrateDown || flags.inflate)) {
    console.error("bad arguments. cannot use with --migrate-up");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.migrateDown && (flags.watch || flags.hotreload || flags.editor || flags.compile || flags.test || flags.migrateUp || flags.inflate)) {
    console.error("bad arguments. cannot use with --migrate-down");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.generateDoc && (flags.watch || flags.hotreload || flags.editor || flags.compile || flags.test || flags.migrateUp || flags.inflate || flags.migrateDown)) {
    console.error("bad arguments. cannot use with --generate-doc");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if ((flags.generateDocAll || flags.generateDocOut || flags.generateDocType) && !flags.generateDoc) {
    console.error("bad arguments. cannot use without --generate-doc");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  const generateDocType = flags.generateDocType ? flags.generateDocType as any : "MD";

  if (flags.https && (!flags.serverOptions.key)) {
    console.error("bad arguments. cannot use --https without --https-key. or set values in miqro.json file.");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.https && (!flags.serverOptions.cert)) {
    console.error("bad arguments. cannot use --https without --https-cert. or set values in miqro.json file.");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  if (flags.httpsRedirect && !flags.https) {
    console.error("bad arguments. cannot use --https-redirect without --https. or set values in miqro.json file.");
    process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }

  return {
    inflateFlat: flags.inflateFlat === null ? false : flags.inflateFlat,
    inflateOnlyAssets: flags.inflateOnlyAssets === null ? undefined : flags.inflateOnlyAssets,
    noMinify: flags.noMinify === null ? false : flags.noMinify,
    noBuild: flags.noBuild === null ? false : flags.noBuild,
    inflateParallel: flags.inflateParallel ? flags.inflateParallel : undefined,
    name: flags.name ? flags.name : undefined,
    browser: flags.browser !== null ? flags.browser : undefined,
    logFile: flags.logFile !== null ? flags.logFile : undefined,
    generateDocAll: flags.generateDocAll ? true : false,
    hotreload: flags.hotreload ? true : false,
    watch: flags.watch ? true : false,
    disableMiqroJSON: flags.disableMiqroJSON !== null ? flags.disableMiqroJSON : false,
    miqroJSONPath: miqroJSONPath ? miqroJSONPath : false,
    // installTypes: flags.installTypes ? true : false,
    installMiqroJSON: flags.installMiqroJSON ? true : false,
    installTSConfig: flags.installTSConfig ? true : false,
    install: flags.install,
    inflate: flags.inflate,
    port: flags.port ? flags.port : getPORT(),
    migrateUp: flags.migrateUp ? true : false,
    migrateDown: flags.migrateDown ? true : false,
    test: flags.test ? true : false,
    compile: flags.compile,
    inflateSEA: flags.inflateSEA ? true : false,
    inflateDir: flags.inflateDir ? resolve(process.cwd(), flags.inflateDir) : resolve(process.cwd(), "inflated"),
    generateDoc: flags.generateDoc = flags.generateDoc ? flags.generateDoc : false,
    generateDocOut: flags.generateDocOut ? resolve(process.cwd(), flags.generateDocOut) : generateDocType === "MD" ? resolve(process.cwd(), "API.md") : resolve(process.cwd(), "API.json"),
    generateDocType,
    services,
    editor: flags.editor ? true : false,
    https: flags.https ? true : false,
    httpsRedirect: flags.httpsRedirect ? flags.httpsRedirect : undefined,
    serverOptions: flags.serverOptions
  }
}
