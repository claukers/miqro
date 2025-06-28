import { Router, newURL, Response, Request, RouterHandlerOptions, Logger, APIRoute, normalizePath, HandlerWithOptions, Handler } from "@miqro/core";
import { existsSync, mkdir, readFile, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve as pathResolve } from "node:path";

import { CONTENT_TYPE_MAP, DEFAULT_CONTENT_TYPE } from "../common/content-type.js";
import { InflateError, importHTMLModule, importAPIRoute, inflateJSX, importJSONModule, JSONModuleValue, jsx2HTML } from "../common/jsx.js";
import { createNodeRuntime } from "@miqro/jsx-node";
import { getHotReloadScript } from "../services/hot-reload.js";
import { RuntimeURL } from "@miqro/jsx";
import { cwd } from "node:process";
import { assertGlobalTampered } from "../services/globals.js";
import { getHTTPRouterPath, getStaticFilesPath } from "../common/paths.js";
import { setupCORS } from "./setup-cors.js";
import { setupAUTH } from "./setup-auth.js";
import { getRoutes } from "../services/utils/get-route.js";
import { describeFilePath, mkdirASync, writeFileASync } from "../common/fs.js";
import { inflateMD2HTML } from "./md.js";
import { MiddlewareConfig, ServerInterface, ServerRequest } from "../types.js";
import { setupMiddleware } from "./setup-middleware.js";
import { setupError } from "./setup-error.js";

export interface RouteFileMap {
  [filePath: string]: {
    routes: {
      path?: string;
      method?: string;
      options?: RouterHandlerOptions;
      inflatePath?: string;
    }[];
    filePath: string;
    service: string;
    previewMethod: "api" | "html" | null;
  }
}

export interface StaticFileMap {
  [filePathKey: string]: {
    path: string;
    filePath: string;
    method: string | null;
    inflatePath?: string;
    contentType: string;
    previewMethod: "html" | null;
    body: Buffer;
  }
}

export async function setupHTTPRouter(server: ServerInterface, logger: Logger, hotreload: boolean, servicePath: string, service: string, routeFileMap: RouteFileMap, staticFileMap: StaticFileMap | null, inflateDir: string | undefined | false, inflateSea: boolean, errors: InflateError[], inflateParallel?: number) {
  const mainRouter = new Router();
  const apiRouterPath = getHTTPRouterPath(servicePath); //resolve(process.cwd(), service, "http");
  let middlewareConfig: MiddlewareConfig | null = null;

  await setupError(logger, servicePath, service, mainRouter, inflateDir, inflateSea, errors);

  await setupCORS(logger, servicePath, service, mainRouter, inflateDir, inflateSea, errors);
  await setupAUTH(logger, servicePath, service, mainRouter, inflateDir, inflateSea, errors);
  middlewareConfig = await setupMiddleware(logger, servicePath, service, mainRouter, inflateDir, inflateSea, errors);

  if (apiRouterPath) {
    logger.trace("setting up http routes from [%s]", service);
    const { router: httpRouter } = await createRouterFromDirectory(server, hotreload, service, logger, apiRouterPath, errors, routeFileMap, staticFileMap, inflateDir, inflateSea, inflateParallel);
    mainRouter.use(httpRouter);
  }

  const staticFilesPath = getStaticFilesPath(servicePath); //resolve(process.cwd(), service, "static");
  if (staticFilesPath) {
    logger.trace("setting up static file routes from [%s]", service);
    const staticRouter = await createStaticRouterFromDirectory(service, logger, staticFilesPath, inflateDir, routeFileMap, staticFileMap, inflateParallel);
    mainRouter.use(staticRouter);
  }

  if (middlewareConfig && middlewareConfig.post) {
    for (const m of middlewareConfig.post) {
      mainRouter.use(m);
    }
  }

  return mainRouter;
}

async function createStaticRoute(service: string, logger: Logger, router: Router, dir: string, file: ScannedFile, inflateDir?: string | undefined | false, routeFileMap?: RouteFileMap, staticFileMap?: StaticFileMap) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      logger.trace("creating static route for [%s]", file.filePath);
      logger.trace("[%o]", {
        file,
        dir
      });
      const contentType = CONTENT_TYPE_MAP[String(file.ext).toLocaleLowerCase()];
      const path = join("/", relative(dir, file.filePath));


      routeFileMap[file.filePath] = {
        routes: [{
          method: "GET",
          path: normalizePath(path)
        }],
        service,
        filePath: file.filePath,
        previewMethod: "html"
      };

      if (inflateDir) {
        const inflatePath = join(inflateDir, service, "static", path);
        mkdir(dirname(inflatePath), {
          recursive: true
        }, (err) => {

        })
        await mkdirASync(dirname(inflatePath), {
          recursive: true
        });
        logger.log("writing [%s]", relative(cwd(), inflatePath));
        const body = readFileSync(file.filePath);
        await writeFileASync(inflatePath, body);
        if (staticFileMap) {
          staticFileMap[file.filePath] = {
            contentType,
            filePath: file.filePath,
            previewMethod: "html",
            method: "GET",
            path: normalizePath(path),
            body: Buffer.from(body),
            inflatePath: inflateDir ? join(inflateDir, service, "static", path) : undefined
          }
        }
      }



      router.use(assertGlobalTampered);
      router.get(path, async function (_req, res) {
        await new Promise<void>((resolve, reject) => {
          try {
            readFile(file.filePath, async (err, body) => {
              if (err) {
                reject(err);
              } else {
                try {
                  await res.asyncEnd({
                    status: 200,
                    headers: {
                      ["Content-Type"]: contentType ? contentType : DEFAULT_CONTENT_TYPE
                    },
                    body
                  });
                  resolve();
                } catch (e) {
                  reject(e);
                }
              }
            })
          } catch (e) {
            reject(e);
          }
        });
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

async function createStaticRouterFromDirectory(service: string, logger: Logger, dir: string, inflateDir: string | false | undefined, routeFileMap: RouteFileMap | undefined, staticFileMap: StaticFileMap | null, inflateParallel?: number): Promise<Router> {
  const router = new Router();
  const maxParallel = inflateParallel ? inflateParallel : 1;
  logger.debug("loading static directory with parallel [%s]", maxParallel);
  let tR = [];
  const files = scanFiles(dir);
  for (const file of files) {
    tR.push(await createStaticRoute(service, logger, router, dir, file, inflateDir, routeFileMap, staticFileMap));
    if (tR.length >= maxParallel) {
      await Promise.all(tR);
      tR = [];
    }
  }
  if (tR.length > 0) {
    await Promise.all(tR);
    tR = [];
  }
  return router;
}

async function createRouterFromDirectory(server: ServerInterface, hotreload: boolean, service: string, logger: Logger, dir: string, errors: InflateError[] = [], routeFileMap: RouteFileMap = {}, staticFileMap: StaticFileMap | null = null, inflateDir: string | undefined | false, inflateSea: boolean, inflateParallel?: number): Promise<{
  router: Router;
  errors: InflateError[];
  routeFileMap: RouteFileMap;
}> {
  const router = new Router();
  const maxParallel = inflateParallel ? inflateParallel : 1;
  server.logger.debug("loading http directory with parallel [%s]", maxParallel);
  let tR = [];
  router.use(assertGlobalTampered);
  const files = scanFiles(dir);
  for (const file of files) {
    tR.push(new Promise<void>(async (resolve) => {
      try {
        switch (file.ext) {
          case ".jsx":
          case ".cjs":
          case ".js":
          case ".ts":
          case ".tsx": {
            switch (file.subExt) {
              case ".test":
                return resolve();
              case ".ignore":
                logger.warn("ignoring [%s]", file.filePath);
                return resolve();
              case ".api": {

                const module = await importAPIRoute(file.filePath, logger);

                const routes = getRoutes(join("/", dirname(relative(dir, file.filePath))), file.subName, module);

                routeFileMap[file.filePath] = {
                  routes,
                  service,
                  filePath: file.filePath,
                  previewMethod: "api"
                };

                const inflatedCode = inflateDir ? await inflateJSX(file.filePath, {
                  embemedJSX: false,
                  minify: false,
                  useExport: true,
                  platform: "node",
                  logger
                }) : "";

                for (const r of routes) {

                  /*if (inflateDir && r.inflatePath) {
                    const rPath = r.inflatePath;
                    const inflatePath = join(inflateDir, service, "http", rPath + ".api.js");
                    mkdirSync(dirname(inflatePath), {
                      recursive: true
                    });
                    logger.log("writing [%s]", relative(cwd(), inflatePath));
                    writeFileSync(inflatePath, inflatedCode);
                  }*/

                  if (inflateDir && r.defaultInflatePath && inflateSea) {
                    const rPath = r.defaultInflatePath;
                    const inflatePath = join(inflateDir, service, "http", rPath + ".api.cjs");
                    await mkdirASync(dirname(inflatePath), {
                      recursive: true
                    });
                    logger.log("writing [%s]", relative(cwd(), inflatePath));
                    await writeFileASync(inflatePath, inflatedCode);
                  }


                  router.use(assertGlobalTampered);
                  router.use(module.handler, r.path, r.method as any, r.options);
                }
                return resolve();
              }
              case ".json": {
                const module = await importJSONModule(file.filePath, logger);
                const routes = getRoutes(join("/", dirname(relative(dir, file.filePath))), file.subName + ".json", module.apiOptions as Partial<APIRoute>);

                routeFileMap[file.filePath] = {
                  routes,
                  service,
                  filePath: file.filePath,
                  previewMethod: "html"
                };

                for (const r of routes) {

                  const contentType = CONTENT_TYPE_MAP[".json"] ? CONTENT_TYPE_MAP[".json"] : DEFAULT_CONTENT_TYPE;



                  if (inflateDir) {

                    if (r.inflatePath) {
                      //if (r.method === "GET" || r.method === "get") {
                      const rPath = r.inflatePath;
                      const inflatePath = join(inflateDir, service, "static", rPath);
                      await mkdirASync(dirname(inflatePath), {
                        recursive: true
                      });
                      if (existsSync(inflatePath) && statSync(inflatePath).isDirectory()) {
                        logger.trace("ignoring writing over directory [%s] for file [%s]", relative(cwd(), inflatePath), file.filePath);
                        continue;
                      }
                      const JSON_STATIC = await getJSON({ server } as ServerRequest, null, newURL(r.path), module.apiOptions?.basePath, module.default);
                      //const JSON = await getJSON({ server } as ServerRequest, null, newURL(r.path), module.apiOptions?.basePath, module.default);
                      logger.log("writing [%s]", relative(cwd(), inflatePath));
                      await writeFileASync(inflatePath, JSON_STATIC);
                      //}

                      if (staticFileMap && inflateSea) {
                        staticFileMap[file.filePath] = {
                          contentType,
                          filePath: file.filePath,
                          method: r.method,
                          previewMethod: "html",
                          path: r.path,
                          body: Buffer.from(JSON_STATIC),
                          inflatePath: inflateDir ? join(inflateDir, service, "static", r.inflatePath) : undefined
                        }
                      }
                    }
                  }

                  router.use(assertGlobalTampered);
                  router.use(async function (req: Request, res: Response) {

                    const JSON = await getJSON(req, res, newURL(req.path), module.apiOptions?.basePath, module.default);

                    return res.asyncEnd({
                      status: 200,
                      headers: {
                        ["Content-Type"]: contentType ? contentType : DEFAULT_CONTENT_TYPE
                      },
                      body: JSON
                    });
                  }, r.path, r.method as any, r.options)
                }

                return resolve();
              }
              case ".html": {

                const module = await importHTMLModule(file.filePath, logger);

                const routes = getRoutes(join("/", dirname(relative(dir, file.filePath))), file.subName + ".html", module.apiOptions as Partial<APIRoute>);

                routeFileMap[file.filePath] = {
                  routes,
                  filePath: file.filePath,
                  service,
                  previewMethod: "html"
                };

                for (const r of routes) {

                  const contentType = CONTENT_TYPE_MAP[".html"] ? CONTENT_TYPE_MAP[".html"] : DEFAULT_CONTENT_TYPE;

                  if (inflateDir) {

                    if (r.inflatePath) {
                      //if (r.method === "GET" || r.method === "get") {
                      const rPath = r.inflatePath;
                      const inflatePath = join(inflateDir, service, "static", rPath);
                      await mkdirASync(dirname(inflatePath), {
                        recursive: true
                      });
                      if (existsSync(inflatePath) && statSync(inflatePath).isDirectory()) {
                        logger.trace("ignoring writing over directory [%s] for file [%s]", relative(cwd(), inflatePath), file.filePath);
                        continue;
                      }
                      const toRender = typeof module.default === "function" ? module.default({ server } as ServerRequest, null) : module.default;
                      const HTML_STATIC = await getHTML(hotreload, { server } as ServerRequest, null, newURL(r.path), module.apiOptions?.basePath, await toRender);

                      logger.log("writing [%s]", relative(cwd(), inflatePath));
                      await writeFileASync(inflatePath, HTML_STATIC);
                      //}


                      if (staticFileMap && inflateSea) {
                        staticFileMap[file.filePath + r.method + r.path] = {
                          filePath: file.filePath,
                          contentType,
                          method: r.method,
                          previewMethod: "html",
                          path: r.path,
                          body: Buffer.from(HTML_STATIC),
                          inflatePath: inflateDir ? join(inflateDir, service, "static", r.inflatePath) : undefined
                        }
                      }
                    }
                  }

                  router.use(assertGlobalTampered);
                  router.use(async function (req: Request, res: Response) {
                    const toRender = typeof module.default === "function" ? module.default(req, res) : module.default;
                    const HTML = await getHTML(hotreload, req, res, newURL(req.path), module.apiOptions?.basePath, await toRender);

                    return res.asyncEnd({
                      status: 200,
                      headers: {
                        ["Content-Type"]: contentType ? contentType : DEFAULT_CONTENT_TYPE
                      },
                      body: HTML
                    });
                  }, r.path, r.method as any, r.options)
                }
                return resolve();
              }
              case ".min":
              case ".js":
              default: {
                // allow fall-through when extension is .js and .ts because is a static route without embemedJSX
                if (file.ext !== ".js" && file.ext !== ".ts") {
                  const code = await inflateJSX(file.filePath, {
                    embemedJSX: true,
                    minify: file.subExt === ".min" ? true : false,
                    useExport: false,
                    logger
                  });
                  const contentType = CONTENT_TYPE_MAP[".js"];
                  const path = join("/", dirname(relative(dir, file.filePath)), file.name + ".js");

                  routeFileMap[file.filePath] = {
                    routes: [{
                      method: "GET",
                      path
                    }],
                    filePath: file.filePath,
                    service,
                    previewMethod: "html"
                  };

                  if (inflateDir) {
                    const inflatePath = join(inflateDir, service, "static", path);
                    await mkdirASync(dirname(inflatePath), {
                      recursive: true
                    });
                    logger.log("writing [%s]", relative(cwd(), inflatePath));
                    await writeFileASync(inflatePath, code);


                    if (staticFileMap && inflateSea) {
                      staticFileMap[file.filePath] = {
                        contentType,
                        filePath: file.filePath,
                        method: "GET",
                        previewMethod: "html",
                        path,
                        body: Buffer.from(code),
                        inflatePath: inflateDir ? join(inflateDir, service, "static", path) : undefined
                      }
                    }
                  }

                  router.use(assertGlobalTampered);
                  router.get(path, async function (req, res) {
                    return res.asyncEnd({
                      status: 200,
                      headers: {
                        ["Content-Type"]: contentType ? contentType : DEFAULT_CONTENT_TYPE
                      },
                      body: code
                    });
                  });
                  return resolve();
                }
              }
            }
          }
          case ".md": {
            switch (file.subExt) {
              case ".html": {
                const code = await inflateMD2HTML(file.filePath, logger);
                const contentType = CONTENT_TYPE_MAP[".html"];
                const path = join("/", dirname(relative(dir, file.filePath)), file.name);
                routeFileMap[file.filePath] = {
                  routes: [{
                    method: "GET",
                    path
                  }],
                  service,
                  filePath: file.filePath,
                  previewMethod: "html"
                };

                if (inflateDir) {
                  const inflatePath = join(inflateDir, service, "static", path);
                  await mkdirASync(dirname(inflatePath), {
                    recursive: true
                  });
                  logger.log("writing [%s]", relative(cwd(), inflatePath));
                  await writeFileASync(inflatePath, code);
                  if (staticFileMap && inflateSea) {
                    staticFileMap[file.filePath] = {
                      contentType,
                      method: "GET",
                      filePath: file.filePath,
                      previewMethod: "html",
                      path,
                      body: Buffer.from(code),
                      inflatePath: inflateDir ? join(inflateDir, service, "static", path) : undefined
                    }
                  }
                }

                router.use(assertGlobalTampered);
                router.get(path, async function (_req, res) {
                  res.asyncEnd({
                    status: 200,
                    headers: {
                      ["Content-Type"]: contentType ? contentType : DEFAULT_CONTENT_TYPE
                    },
                    body: code
                  });
                });
                return resolve();
              }
            }
          }
          default:
            if (file.ext === ".js" || file.ext === ".ts") {
              switch (file.subExt) {
                case ".ignore": {
                  logger.warn("ignoring [%s]", file.filePath);
                  return resolve();
                }
                case ".bundle":
                case ".min": {
                  const code = await inflateJSX(file.filePath, {
                    embemedJSX: false,
                    minify: file.subExt === ".min" ? true : false,
                    useExport: false,
                    platform: false,
                    logger
                  });
                  const contentType = CONTENT_TYPE_MAP[".js"];
                  const path = join("/", dirname(relative(dir, file.filePath)), file.name + ".js");
                  routeFileMap[file.filePath] = {
                    routes: [{
                      method: "GET",
                      path
                    }],
                    filePath: file.filePath,
                    service,
                    previewMethod: "html"
                  };

                  if (inflateDir) {
                    const inflatePath = join(inflateDir, service, "static", path);
                    await mkdirASync(dirname(inflatePath), {
                      recursive: true
                    });
                    logger.log("writing [%s]", relative(cwd(), inflatePath));
                    await writeFileASync(inflatePath, code);
                    if (staticFileMap && inflateSea) {
                      staticFileMap[file.filePath] = {
                        contentType,
                        method: "GET",
                        filePath: file.filePath,
                        previewMethod: "html",
                        path,
                        body: Buffer.from(code),
                        inflatePath: inflateDir ? join(inflateDir, service, "static", path) : undefined
                      }
                    }
                  }

                  router.use(assertGlobalTampered);
                  router.get(path, async function (_req, res) {
                    res.asyncEnd({
                      status: 200,
                      headers: {
                        ["Content-Type"]: contentType ? contentType : DEFAULT_CONTENT_TYPE
                      },
                      body: code
                    });
                  });
                  return resolve();
                }
              }
            } else if (file.ext === ".bundle") {
              switch (file.subExt) {
                case ".ignore": {
                  logger.warn("ignoring [%s]", file.filePath);
                  return resolve();
                }
                case ".css": {
                  const code = readFileSync(file.filePath).toString()
                    .split("\n")
                    .filter(c => c)
                    .filter(c => c.charAt(0) !== "#")
                    .map(cssPath => readFileSync(pathResolve(dirname(file.filePath), cssPath)).toString())
                    .join("\n");
                  const contentType = CONTENT_TYPE_MAP[".css"];
                  const path = join("/", dirname(relative(dir, file.filePath)), file.name);
                  routeFileMap[file.filePath] = {
                    routes: [{
                      method: "GET",
                      path
                    }],
                    service,
                    filePath: file.filePath,
                    previewMethod: "html"
                  };

                  if (inflateDir) {
                    const inflatePath = join(inflateDir, service, "static", path);
                    await mkdirASync(dirname(inflatePath), {
                      recursive: true
                    });
                    logger.log("writing [%s]", relative(cwd(), inflatePath));
                    await writeFileASync(inflatePath, code);
                    if (staticFileMap && inflateSea) {
                      staticFileMap[file.filePath] = {
                        contentType,
                        method: "GET",
                        filePath: file.filePath,
                        previewMethod: "html",
                        path,
                        body: Buffer.from(code),
                        inflatePath: inflateDir ? join(inflateDir, service, "static", path) : undefined
                      }
                    }
                  }

                  router.use(assertGlobalTampered);
                  router.get(path, async function (_req, res) {
                    res.asyncEnd({
                      status: 200,
                      headers: {
                        ["Content-Type"]: contentType ? contentType : DEFAULT_CONTENT_TYPE
                      },
                      body: code
                    });
                  });
                  return resolve();
                }
              }
            }
            await createStaticRoute(service, logger, router, dir, file, inflateDir, routeFileMap, staticFileMap);
            return resolve();

        }
      } catch (e) {
        logger.error("error with " + file.filePath);
        logger.error(e);
        errors.push({
          filePath: file.filePath,
          error: e
        });
      } finally {
        return resolve();
      }
    }));
    if (tR.length >= maxParallel) {
      await Promise.all(tR);
      tR = [];
    }
  }
  if (tR.length > 0) {
    await Promise.all(tR);
    tR = [];
  }
  router.use(assertGlobalTampered);
  return {
    routeFileMap,
    router,
    errors
  };
}

interface ScannedFile {
  filePath: string;
  ext: string;
  fileName: string;
  name: string;
  subExt: string;
  subName: string;
}

export function scanFiles(path: string, ret: ScannedFile[] = []): ScannedFile[] {
  const files = readdirSync(path).sort();
  for (const file of files) {
    const filePath = pathResolve(path, file);
    if (statSync(filePath).isDirectory()) {
      scanFiles(filePath, ret);
      continue;
    } else {
      const description = describeFilePath(filePath);
      if (description.fileName === ".DS_Store") {
        continue;
      }
      ret.push(description);
    }
  }
  return ret;
}



function getHTML(hotreload: boolean, req: ServerRequest, res: Response | null, url: RuntimeURL, basePath: string | undefined, out: JSX.Element): string {
  let HTML = `<!DOCTYPE html>\n${jsx2HTML(out, createNodeRuntime({
    url,
    basePath
  }))}`;

  //console.log("GET_HTML[%s] [%o]", HTML, out);

  if (hotreload) {
    HTML += getHotReloadScript()
  }
  return HTML;
}

async function getJSON(req: ServerRequest, res: Response | null, url: RuntimeURL, basePath: string | undefined, out: JSONModuleValue | Promise<JSONModuleValue> | ((req: Request | null, res: Response | null) => JSONModuleValue | Promise<JSONModuleValue>)) {

  const toRender = await (typeof out === "function" ? out(req, res) : out);
  return JSON.stringify(toRender, undefined, 2);
}
