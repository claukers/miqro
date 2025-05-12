import { Logger, Router } from "@miqro/core";
import { Arguments } from "../common/arguments.js";
import { writeFileSync } from "node:fs";
import { getMDDoc } from "./doc-md.js";
import { EXIT_CODES } from "../common/constants.js";
import { InflatedResult } from "../services/app.js";
import { RouteFileMap } from "../inflate/setup-http.js";
import { inflateMD2HTML, inflateMDString2HTML } from "../inflate/md.js";

export async function generateDocs(args: Arguments, logger: Logger, result: InflatedResult) {
  logger.info("writing [%s]", args.generateDocOut);
  writeFileSync(args.generateDocOut, await getDocOutput(result.router, result.fileMap, args.generateDocAll, args.generateDocType));
}

export async function getDocOutput(router: Router, fileMap: RouteFileMap, generateDocAll: boolean, generateDocType: "MD" | "JSON" | "HTML") {
  /*
    ** TODO FIX THIS MESS
    */

  const fileMapAPIRouteList = Object.keys(fileMap).map(f => fileMap[f]).filter(fMap => fMap.previewMethod === "api").map(fMap => fMap.routes);

  const jsonDoc = router.getJSONDoc();

  if (!generateDocAll) {
    Object.keys(jsonDoc).forEach(path => {
      const methods = Object.keys(jsonDoc[path]);
      methods.forEach(method => {
        const data = jsonDoc[path][method];
        //console.log("[%s] [%s]", path, method);

        if (fileMapAPIRouteList.filter(f => {
          for (const r of f) {
            if (r.method === String(method).toUpperCase() && r.path === path) {
              return true;
            }
          }
          return false;
        }).length === 0) {
          //console.log("DELETE [%s] [%s]", path, method);
          delete jsonDoc[path][method];
        } else {
          //console.log("KEEP [%s] [%s]", path, method);
        }

      });
    });
  }

  switch (generateDocType) {
    case "JSON":
      return JSON.stringify(jsonDoc, undefined, 2);
      break;
    case "MD":
      return await getMDDoc({ showFilePath: true, jsonDoc });
      break;
    case "HTML":
      const md = await getMDDoc({ showFilePath: true, jsonDoc });
      const html = inflateMDString2HTML(md);
      return html;
      break;
    default:
      process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }
}
