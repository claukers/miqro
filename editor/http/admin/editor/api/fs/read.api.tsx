import { APIRoute, defineRoute, JSONParser } from "@miqro/core";
import { readFileSync, realpathSync } from "node:fs";
import { SUPPORTED_LANGUAGES } from "../../../../../common/constants.js";
import { relative, resolve } from "node:path";
import { getLanguage } from "./scan.api.js";
import { BASE_PATH } from "../../../../../common/constants.server.js";

export default defineRoute({
  method: "POST",
  path: "/read",
  description: "admin editor file read endpoint",
  middleware: [JSONParser()],
  request: {
    body: {
      path: "string"
    }
  },
  response: {
    status: [200, 400],
    body: {
      contents: "string",
      path: "string"
    }
  },
  handler: async (req, res) => {
    const { path } = req.body;
    const contents = readFile(path);
    return res?.json({
      contents,
      path
    });
  }
});

export function readFile(path: string) {
  const filePath = getPath(path);
  const language = getLanguage(filePath);
  if (SUPPORTED_LANGUAGES.includes(language)) {
    const contents = readFileSync(filePath).toString();
    return contents;
  } else {
    throw new Error("unsupported file format");
  }

}

export function getPath(path: string) {
  const realPath = realpathSync(resolve(BASE_PATH, path));

  if (relative(BASE_PATH, realPath).startsWith("..")) {
    throw new Error("invalid path! [" + path + "]");
  }

  return realPath;
}
