import { Logger } from "@miqro/core";
import { Arguments } from "../common/arguments.js";
import { writeFileSync } from "node:fs";
import { getMDDoc } from "./doc-md.js";
import { EXIT_CODES } from "../common/constants.js";
import { InflatedResult } from "../services/app.js";

export async function generateDocs(args: Arguments, logger: Logger, result: InflatedResult) {
  /*
  ** TODO FIX THIS MESS
  */

  const router = result.router;
  const fileMap = result.fileMap;

  const fileMapAPIRouteList = Object.keys(fileMap).map(f => fileMap[f]).filter(fMap => fMap.previewMethod === "api").map(fMap => fMap.routes);

  const jsonDoc = router.getJSONDoc();

  if (!args.generateDocAll) {
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

  switch (args.generateDocType) {
    case "JSON":
      logger.info("writing [%s]", args.generateDocOut);
      writeFileSync(args.generateDocOut, JSON.stringify(jsonDoc, undefined, 4));
      break;
    case "MD":
      logger.info("writing [%s]", args.generateDocOut);
      writeFileSync(args.generateDocOut, await getMDDoc({ showFilePath: true, jsonDoc }));
      break;
    default:
      logger.error("--generate-doc-type invalid!");
      process.exit(EXIT_CODES.BAD_ARGUMENTS);
  }
}
