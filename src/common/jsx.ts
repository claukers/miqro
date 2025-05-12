import { Runtime } from "@miqro/jsx";
import { createNodeRuntime } from "@miqro/jsx-node";
import { basename, dirname, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { Request, Response, CORSOptions, Logger, APIRoute } from "@miqro/core";
import { Parser, Schema } from "@miqro/parser";
import { APIRouteSchema, SessionHandlerOptionsSchema } from "@miqro/core";
import { cwd } from "node:process";

import { esBuild } from "./esbuild.js";
import { assertGlobalTampered, browserJSXGlobals } from "../services/globals.js";
import { APIOptions, ServerConfig, WSConfig, AuthConfig, DBConfig, LogConfig, MiddlewareConfig, ErrorConfig } from "../types.js";
import { getJSXJSPath, JSX_TMP_DIR } from "./paths.js";
import { CLEAR_JSX_CACHE } from "./constants.js";
import { getAsset, initAsset, validateAsset } from "./assets.js";
import { calculateChecksumFromBuffer } from "./checksum.js";
import { HandlerWithOptionsSchema, RouteOptionsSchema } from "@miqro/core/build/types.js";
import { Migration } from "@miqro/query";

let jsxJSBuffer: null | Buffer = null; // Buffer.from(getAsset("jsx.dom.js"));
let jsxJSBufferChecksumPromise: null | Promise<string> = null; // calculateChecksumFromBuffer(jsxJSBuffer);

export async function initJSXJS(logger: Logger) {
  jsxJSBuffer = jsxJSBuffer ? jsxJSBuffer : Buffer.from(getAsset("jsx.dom.js"));
  jsxJSBufferChecksumPromise = jsxJSBufferChecksumPromise ? jsxJSBufferChecksumPromise : calculateChecksumFromBuffer(jsxJSBuffer);
  return initAsset(logger, getJSXJSPath(), jsxJSBuffer, true, jsxJSBufferChecksumPromise, false);
}

export async function validateJSXJS(logger: Logger) {
  const checksum = await jsxJSBufferChecksumPromise;
  if (!checksum) {
    throw new Error("error calculating checksum");
  }
  return validateAsset(logger, getJSXJSPath(), checksum);
}

export interface Dict<T> {
  [key: string]: T | Dict<T>;
}

const parser = new Parser();

export interface InflateError {
  filePath: string;
  error: Error;
}

export interface InflateOptions {
  embemedJSX: boolean;
  minify: boolean;
  useExport: boolean;
  logger?: Logger | Console;
}

const DEFAULT_ESOPTION = {
  platform: "neutral",
  bundle: true,
  jsxFactory: "JSX.createElement",
  jsxFragment: "JSX.Fragment"
};

export async function inflateJSX(inFile: string, options: InflateOptions): Promise<string> {
  const tmpBuildDir = resolve(JSX_TMP_DIR, String(process.pid), "build", Date.now() + "-" + randomUUID());
  const inFileTmp = resolve(tmpBuildDir, basename(inFile) + ".mjs");
  const jsxJSPath = getJSXJSPath();//resolve(tmpBuildDir, "jsx.js");
  const logger = options.logger; //getLogger(`${SERVER_IDENTIFIER}_JSX`);

  try {

    if (!options.embemedJSX) {
      mkdirSync(tmpBuildDir, {
        recursive: true
      });
      writeFileSync(inFileTmp, browserJSXGlobals(inFile, false, options.useExport));
      //writeFileSync(inFileTmp, browserJSXGlobals(relative(tmpBuildDir, inFile), false));
      logger?.trace("inflating [%s] from [%s]. to change the import folder set JSX_TMP", relative(cwd(), inFile), dirname(relative(JSX_TMP_DIR, inFileTmp)));
      const { outputFiles: [{ contents }] } = await esBuild({
        ...DEFAULT_ESOPTION,
        entryPoints: [inFileTmp],
        minify: options.minify
      });
      if (CLEAR_JSX_CACHE) {
        logger?.trace("clearing cache at [%s] to change this behaivor set CLEAR_JSX_CACHE to 0", tmpBuildDir);
        unlinkSync(inFileTmp);
        rmdirSync(tmpBuildDir);
      }
      return contents;
    } else {
      mkdirSync(tmpBuildDir, {
        recursive: true
      });
      //writeFileSync(jsxJSPath, Buffer.from(getAsset("jsx-dom-bundle")));
      writeFileSync(inFileTmp, browserJSXGlobals(inFile, jsxJSPath));
      //writeFileSync(inFileTmp, browserJSXGlobals(relative(tmpBuildDir, inFile), relative(tmpBuildDir, jsxJSPath)));
      logger?.trace("inflating [%s] from [%s] with jsx.js embedded. to change the import folder set JSX_TMP", relative(cwd(), inFile), dirname(relative(JSX_TMP_DIR, inFileTmp)));
      const { outputFiles: [{ contents }] } = await esBuild({
        ...DEFAULT_ESOPTION,
        entryPoints: [inFileTmp],
        minify: options.minify
      });
      if (CLEAR_JSX_CACHE) {
        logger?.trace("clearing cache at [%s] to change this behaivor set CLEAR_JSX_CACHE to 0", tmpBuildDir);
        unlinkSync(inFileTmp);
        //unlinkSync(jsxJSPath);
        rmdirSync(tmpBuildDir);
      }
      return contents;
    }
  } catch (e) {
    logger?.error("error with: " + inFile);
    logger?.error(e);
    if (options.embemedJSX) {
      if (CLEAR_JSX_CACHE) {
        logger?.trace("clearing cache at [%s] to change this behaivor set CLEAR_JSX_CACHE to 0", tmpBuildDir);
        unlinkSync(inFileTmp);
        //unlinkSync(jsxJSPath);
        rmdirSync(tmpBuildDir);
      } else {
        //console.error("errors on: " + tmpBuildDir);
        logger?.error("error with: %s", inFileTmp);
        logger?.trace("NOT clearing cache. to change this behaivor set CLEAR_JSX_CACHE to 1", tmpBuildDir);
      }
    }
    throw e;
  }
}

export const APIOptionsSchema: Schema<APIOptions> = {
  type: "object?",
  properties: {
    basePath: "string?",
    path: "string?|string[]?",
    method: "string?|string[]?",
    parser: {
      type: "object?",
      properties: {
        parse: "function"
      },
      mode: "add_extra"
    },
    middleware: "function[]!?",
    session: {
      type: "object?|function?",
      properties: SessionHandlerOptionsSchema.properties
    },
    ...RouteOptionsSchema.properties
  },
  //mode:"add_extra"
};

export interface HTMLModule {
  default: JSX.Element | ((req: Request | null, res: Response | null) => (Promise<JSX.Element> | JSX.Element));
  apiOptions?: APIOptions;
}

export const HTMLModuleSchema: Schema<HTMLModule> = {
  type: "object",
  properties: {
    default: {
      type: "function|object"
    },
    apiOptions: APIOptionsSchema
  },
  //mode:"add_extra"
}

export type JSONModuleValue = string | object;

export interface JSONModule {
  default: JSONModuleValue | ((req: Request | null, res: Response | null) => (Promise<JSONModuleValue> | JSONModuleValue));
  apiOptions?: APIOptions;
}

export const JSONModuleSchema: Schema<JSONModule> = {
  type: "object",
  properties: {
    default: {
      type: "function|object|string"
    },
    apiOptions: APIOptionsSchema
  },
  //mode:"add_extra"
}

export const MigrationSchema: Schema<Migration> = {
  type: "object",
  properties: {
    up: "function",
    down: "function"
  },
  mode: "add_extra"
}

export const CORSOptionsSchema: Schema<CORSOptions> = {
  type: "object",
  properties: {
    origins: "string[]?|string?",
    validate: "function?",
    methods: "string?",
    preflightContinue: "boolean?"
  },
  //mode:"add_extra"
}

export const WSConfigSchema: Schema<WSConfig> = {
  type: "object",
  properties: {
    path: "string",
    disabled: "boolean?",
    maxConnections: "number?",
    validate: "function?",
    onConnection: "function?",
    onMessage: "function?",
    onDisconnect: "function?"
  },
  //mode:"add_extra"
};

export const DBConfigSchema: Schema<DBConfig> = {
  type: "object",
  properties: {
    url: "string?",
    disabled: "boolean?",
    storage: "string?",
    dialect: "string?",
    name: "string"
  },
  //mode:"add_extra"
}

export const ServerConfigSchema: Schema<ServerConfig> = {
  type: "object",
  properties: {
    preload: "function?",
    unload: "function?",
    stop: "function?",
    start: "function?",
    load: "function?"
  },
  //mode:"add_extra"
};

export const LogConfigSchema: Schema<LogConfig> = {
  type: "object",
  properties: {
    level: {
      type: "enum?",
      enumValues: ["error", "warn", "info", "debug", "trace", "none"]
    },
    replaceConsoleTransport: "boolean?",
    replaceFileTransport: "boolean?",
    write: "function"
  },
  //mode:"add_extra"
};

export const AuthConfigSchema: Schema<AuthConfig> = {
  type: "object",
  properties: {
    ...SessionHandlerOptionsSchema.properties
  },
  //mode:"add_extra"
}

export const MiddlewareConfigSchema: Schema<MiddlewareConfig> = {
  type: "object",
  properties: {
    middleware: {
      type: "Array",
      arrayType: "function|object",
      required: false,
      properties: {
        ...HandlerWithOptionsSchema.properties
      }
    },
    post: {
      type: "Array",
      arrayType: "function|object",
      required: false,
      properties: {
        ...HandlerWithOptionsSchema.properties
      }
    }
  },
}

export const ErrorConfigSchema: Schema<ErrorConfig> = {
  type: "object",
  properties: {
    catch: {
      type: "Array",
      required: false,
      arrayType: "function"
    }
  },
}

export async function importAPIRoute(inFile: string, logger?: Logger) {
  const mod = (await importJSXFile(inFile, logger)).default;
  const module = typeof mod === "function" ? { handler: mod } : parser.parse(mod, APIRouteSchema, basename(inFile));
  if (module !== undefined) {
    return module as APIRoute;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importMigrationModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, MigrationSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importHTMLModule(inFile: string, logger?: Logger) {
  const module = (await importJSXFile(inFile, logger));
  parser.parse(module.default, HTMLModuleSchema.properties.default, `${basename(inFile)}.default`);
  parser.parse(module.apiOptions, APIOptionsSchema, `${basename(inFile)}.apiOptions`);
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importJSONModule(inFile: string, logger?: Logger) {
  const module = (await importJSXFile(inFile, logger));
  parser.parse(module.default, JSONModuleSchema.properties.default, `${basename(inFile)}.default`);
  parser.parse(module.apiOptions, APIOptionsSchema, `${basename(inFile)}.apiOptions`);
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importAuthModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, AuthConfigSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importMiddlewareConfigModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, MiddlewareConfigSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importErrorConfigModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, ErrorConfigSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importConfigConfigModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, MiddlewareConfigSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importCORSModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, CORSOptionsSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importWSConfigModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, WSConfigSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importDBConfigModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, DBConfigSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importLogConfigModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, LogConfigSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importServerConfigModule(inFile: string, logger?: Logger) {
  const module = parser.parse((await importJSXFile(inFile, logger)).default, ServerConfigSchema, basename(inFile));
  if (module !== undefined) {
    return module;
  } else {
    throw new Error(`error with module [${inFile}] undefined`);
  }
}

export async function importJSXFile(inFile: string, logger?: Logger | Console): Promise<any> {
  const inflatedCode = await inflateJSX(inFile, {
    embemedJSX: false,
    minify: false,
    useExport: true,
    logger
  });
  const tmpBuildDir = resolve(JSX_TMP_DIR, String(process.pid), "import", Date.now() + "-" + randomUUID());
  const inFileTmp = resolve(tmpBuildDir, basename(inFile) + ".mjs");
  //const logger = getLogger(`${SERVER_IDENTIFIER}_JSX`);
  mkdirSync(tmpBuildDir, {
    recursive: true
  });
  try {
    writeFileSync(inFileTmp, inflatedCode);
    assertGlobalTampered();
    logger?.trace("importing [%s] from [%s]. to change the import folder set JSX_TMP", relative(cwd(), inFile), dirname(relative(JSX_TMP_DIR, inFileTmp)));
    logger?.debug("importing [%s]", relative(cwd(), inFile));
    const module = await import(inFileTmp);
    assertGlobalTampered();
    if (CLEAR_JSX_CACHE) {
      logger?.trace("clearing cache at [%s]. to change this behaivor set CLEAR_JSX_CACHE to 0", tmpBuildDir);
      unlinkSync(inFileTmp);
      rmdirSync(tmpBuildDir);
    }
    return module;
  } catch (e) {
    logger?.error(e);
    logger?.error("error with: " + inFile);
    if (CLEAR_JSX_CACHE) {
      logger?.trace("clearing cache at [%s] to change this behaivor set CLEAR_JSX_CACHE to 0", tmpBuildDir);
      unlinkSync(inFileTmp);
      rmdirSync(tmpBuildDir);
    } else {
      //console.error("errors on: " + tmpBuildDir);
      logger?.error("error with: %s", inFileTmp);
      logger?.trace("NOT clearing cache. to change this behaivor set CLEAR_JSX_CACHE to 1", tmpBuildDir);
    }
    throw e;
  }
}

export function jsx2HTML(out: JSX.Element, runtime?: Runtime): string {
  runtime = runtime ? runtime : createNodeRuntime();
  const element = runtime.createElement("root");
  const container = runtime.createContainer(element, {
    shadowInit: false, runtimeOptions: {
      disableEffects: true,
      disableEvents: true,
      disableRefListener: true,
      disableRefresh: true
    }
  });
  container.render(out);
  //console.log("jsx2HTML [%s]", element);
  let HTML = "";
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    //console.log("jsx2HTML child [%s]", child);
    //console.log("jsx2HTML child [%s]", (child as any).toString("  ", -1));
    HTML += (child as any).toString("  ", -1);
  }
  container.disconnect();
  //console.log("jsx2HTML [%s]", HTML);
  return HTML;
}
