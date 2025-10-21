import { importJSXFile, ImportJSXFileOptions } from "../common/jsx.js";
import { Logger } from "@miqro/core";
import { scanFiles } from "./setup-http.js";
import { resolve } from "node:path";

export async function setupTests(logger: Logger, servicePath: string, options: ImportJSXFileOptions) {
  logger.debug("setting up tests from [%s]", servicePath);
  const files = scanFiles(resolve(servicePath));
  await Promise.allSettled(files.map((file) => {
    switch (file.ext) {
      case ".jsx":
      case ".js":
      case ".ts":
      case ".tsx": {
        switch (file.subExt) {
          case ".test":
            return importJSXFile(file.filePath, options, logger);
        }
      }
    }
    return Promise.resolve();
  }));
}
