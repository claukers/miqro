import { APIRoute } from "@miqro/core";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { getPath } from "./read.api.js";
import { dirname } from "node:path";

export default {
  middleware: [server.middleware.json()],
  method: "POST",
  description: "admin editor file rename endpoint",
  path: "/rename",
  request: {
    body: {
      path: "string",
      newName: "string"
    }
  },
  response: {
    status: [200, 400],
    body: {
      message: "string"
    }
  },
  handler: async (req, res) => {
    const { path, newName } = req.body;
    await rename(path, newName);
    return res?.json({
      message: "OK"
    });
  }
} as APIRoute;

export async function rename(path: string, newName: string) {
  if (existsSync(path) && !existsSync(newName)) {
    mkdirSync(dirname(getPath(newName)), {
      recursive: true
    });
    renameSync(getPath(path), getPath(newName));
  } else {
    throw new Error("invalid paths");
  }
}
