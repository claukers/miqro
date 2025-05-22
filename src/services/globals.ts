//@ts-ignore
import { ReadBuffer, URLEncodedParser, JSONParser, TextParser, CORS, SessionHandler } from "@miqro/core";
import { strictEqual } from "node:assert";
import { HTMLEncode } from "@miqro/jsx-node";
import { createElement as realCreateElement, enableDebugLog, useRuntime, Link, Router, usePathname, Fragment, useEffect, useRef, useState, useQuery, useRefresh, useElement, createContext, useContext, Component, Props } from "@miqro/jsx";

import { jsx2HTML } from "../common/jsx.js";
import { inflateMD2HTML } from "../inflate/md.js";
import { EXIT_CODES } from "../common/constants.js";
import { ServerGlobal } from "../lib.js";
import { decodeJWT, decodeProtectedHeaderJWT, decryptJWT, encryptJWT, signJWT, verifyJWT } from "../common/jwt.js";
import { createSecretKey } from "node:crypto";

/*const globaljsx: any = Object.freeze({
  useContext,
  useRuntime,
  createContext,
  useState,
  useEffect,
  useQuery,
  useRef,
  useElement,
  useRefresh,
  Link,
  Router,
  usePathname
});*/
const globalJSX: any = Object.freeze({
  createElement: (...args: [tag: string | Component | typeof Fragment, attributes: Props | null | undefined, ...children: Array<any>]) => {
    const ret = realCreateElement(...args);
    ret.toString = () => jsx2HTML(ret)
    return ret;
  },
  Fragment,
  enableDebugLog
});
const globaljsx: any = Object.freeze({
  useContext,
  useRuntime,
  createContext,
  useState,
  useEffect,
  useQuery,
  useRef,
  useElement,
  useRefresh,
  Link,
  Router,
  usePathname,
  define: function define() {
    /*const callSites = getCallSite();
    const caller = callSites[2];
    if (CLEAR_JSX_CACHE) {
      const scriptName = basename(caller.scriptName);
      const originalName = scriptName.substring(0, scriptName.length - ".mjs".length);
      //server.logger.debug("browser.define not available server side!");
      //server.logger.trace("browser.define not available server side! %s", originalName);
    } else {
      //server.logger.debug("browser.define not available server side!");
      //server.logger.trace("browser.define not available server side! %s:%s:%s", caller.scriptName, caller.lineNumber, caller.column);
    }*/
  }
});
const globalWindow: any = Object.freeze({
  addEventListener: function define() {
    /*const callSites = getCallSite();
    const caller = callSites[2];
    if (CLEAR_JSX_CACHE) {
      const scriptName = basename(caller.scriptName);
      //server.logger.debug("window.addEventListener not available server side!");
      server.logger.trace("window.addEventListener not available server side! %s", scriptName.substring(0, scriptName.length - ".mjs".length));
    } else {
      //server.logger.debug("window.addEventListener not available server side!");
      server.logger.trace("window.addEventListener not available server side! %s:%s:%s", caller.scriptName, caller.lineNumber, caller.column);
    }*/
  }
});
const globalServer: ServerGlobal = Object.freeze<ServerGlobal>({
  middleware: Object.freeze({
    buffer: ReadBuffer,
    url: URLEncodedParser,
    json: JSONParser,
    text: TextParser,
    cors: CORS,
    session: SessionHandler
  }),
  encodeHTML: HTMLEncode,
  inflateMDtoHTML: inflateMD2HTML,
  createSecretKey,
  jwt: {
    decode(jwt) {
      return decodeJWT(jwt);
    },
    decodeProtectedHeader(token) {
      return decodeProtectedHeaderJWT(token);
    },
    decrypt(jwt, secret, options) {
      return decryptJWT(jwt, secret, options);
    },
    encrypt(payload, secret, options) {
      return encryptJWT(payload, secret, options);
    },
    sign(payload, secret, options) {
      return signJWT(payload, secret, options);
    },
    verify(jwt, secret, options) {
      return verifyJWT(jwt, secret, options);
    }
  }
}) as ServerGlobal;

export function browserJSXGlobals(inFile: string, jsxPath: string | false = false, useExport = true): string {
  const PRE = `import { enableDebugLog, useRuntime, Link, usePathname, createContext, useContext, useElement, useRefresh, useQuery, define, Router, useState, useEffect, useRef, createElement, Fragment } from "${jsxPath}";
    globalThis.JSX = Object.freeze({
      createElement,
      Fragment,
      enableDebugLog
    });
    
    globalThis.newParser = () => new Parser();
    globalThis.jsx = Object.freeze({
      define,
      useRuntime,
      createContext, 
      useContext, 
      useState,
      useEffect,
      useQuery,
      useRef,
      useElement,
      useRefresh,
      usePathname,
      Link,
      Router
    });`;
  return `${jsxPath ? PRE : ""}\n${useExport ? `export * from "${inFile}";import * as lib from "${inFile}";export default lib.default;` : `import * as lib from "${inFile}"`}`;
}

export function initGlobals() {//webSocketManager: WebSocketManager, dbManager: DBManager) {
  //const logger = getLogger(SERVER_IDENTIFIER);  
  globalThis.server = globalServer;
  //globalThis.jsx = globaljsx;
  /*for (const key of Object.keys(globaljsx)) {
    globalThis[key] = globaljsx[key];
  }*/
  globalThis.JSX = globalJSX;
  globalThis.jsx = globaljsx;
  globalThis.window = globalWindow;
}

export function assertGlobalTampered() {
  try {
    //strictEqual(globalThis.utils, globalUtils, "globalThis.utils tamperered");
    strictEqual(globalThis.JSX, globalJSX, "globalThis.JSX tamperered");
    //strictEqual(globalThis.jsx, globaljsx, "globalThis.jsx tamperered");
    /*for (const key of Object.keys(globaljsx)) {
      strictEqual(globalThis[key], globaljsx[key], "globalThis.jsx tamperered");
    }*/
    strictEqual(globalThis.server, globalServer, "globalThis.server tamperered");
    strictEqual(globalThis.jsx, globaljsx, "globalThis.jsx tamperered");
    strictEqual(globalThis.window, globalWindow, "globalThis.window tamperered");
  } catch (e) {
    console.error(e);
    process.exit(EXIT_CODES.GLOBALS_ALTERED);
  }
}
