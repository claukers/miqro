import { APIRoute, JSONParser } from "@miqro/core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { getPath } from "./read.api.js";
import { dirname } from "node:path";

export default {
  middleware: [JSONParser()],
  method: "POST",
  path: "/write",
  description: "admin editor file write endpoint",
  request: {
    body: {
      path: "string",
      contents: "string",
      override: "boolean?"
    }
  },
  response: {
    status: [200, 400],
    body: {
      message: "string"
    }
  },
  handler: async (req, res) => {
    const { path, contents, override } = req.body;
    await writeFile(path, contents, override);
    return res.json({
      message: "OK"
    });
  }
} as APIRoute;

async function writeFile(path: string, contents: string, override?: boolean) {
  if (existsSync(getPath(path)) && !override) {
    throw new Error("file already exists!");
  }
  mkdirSync(dirname(getPath(path)), {
    recursive: true
  });
  writeFileSync(getPath(path), contents);
}
