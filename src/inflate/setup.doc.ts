import { Logger, Router } from "@miqro/core";
import { importDocConfigModule, ImportJSXFileOptions, InflateError, inflateJSX } from "../common/jsx.js";
import { getDocConfigPath } from "../common/paths.js";
import { basename, dirname, join, relative, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { cwd } from "node:process";
import { getDocOutput } from "../bin/generate-doc.js";
import { RouteFileMap, StaticFileMap } from "./setup-http.js";
import { CONTENT_TYPE_MAP } from "../common/content-type.js";

export async function setupDoc(logger: Logger, servicePath: string, service: string, mainRouter: Router, fileMap: RouteFileMap, staticFileMap: StaticFileMap, inflateDir: string | undefined | false, errors: InflateError[], options: ImportJSXFileOptions) {
  const docPath = getDocConfigPath(servicePath); //resolve(process.cwd(), service, "auth.ts");

  if (docPath) {
    try {
      const docModule = await importDocConfigModule(docPath, options, logger);
      logger.debug("setting up error handling from [%s]", join(service, basename(docPath)));
      if (docModule && docModule.publish) {
        const paths = Object.keys(docModule.publish);
        for (const path of paths) {
          const config = docModule.publish[path];

          const contentType = config.type === "MD" ? CONTENT_TYPE_MAP[".md"] :
            config.type === "JSON" ? CONTENT_TYPE_MAP[".json"] : CONTENT_TYPE_MAP[".html"];

          const body = await getDocOutput(mainRouter, fileMap, config.all, config.type);
          mainRouter.get(path, async (_, res) => {
            switch (config.type) {
              case "MD": {
                return await res.asyncEnd({
                  headers: {
                    "content-type": contentType
                  },
                  status: 200,
                  body
                });
              }
              case "JSON": {
                return await res.json(body);
              }
              case "HTML": {
                return await res.html(body);
              }
              default:
                return true;
            }
          });

          if (inflateDir) {
            const inflatePath = join(inflateDir, service, "static", path);
            mkdirSync(dirname(inflatePath), {
              recursive: true
            });
            logger.log("writing [%s]", relative(cwd(), inflatePath));
            writeFileSync(inflatePath, body);

            fileMap[docPath + path] = {
              routes: [{
                method: "GET",
                path
              }],
              service,
              filePath: docPath,
              previewMethod: "html"
            };

            if (staticFileMap) {
              staticFileMap[docPath + path] = {
                contentType,
                filePath: docPath,
                previewMethod: "html",
                method: "GET",
                path,
                body: Buffer.from(body),
                inflatePath: inflateDir ? join(inflateDir, service, "static", path) : undefined
              }
            }
          }
        }
      }

    } catch (e) {
      errors.push({
        filePath: docPath,
        error: e
      });
      logger.error("error with " + docPath);
      logger.error(e);
    }
  }
  return null;
}
