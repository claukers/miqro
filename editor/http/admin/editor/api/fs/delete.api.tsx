import { defineRoute, JSONParser } from "@miqro/core";
import { unlinkSync } from "node:fs";
import { getPath } from "./read.api.js";

export default defineRoute({
  description: "admin editor file deletion endpoint",
  method: "POST",
  path: "/delete",
  middleware: [JSONParser()],
  request: {
    body: {
      path: "string"
    }
  },
  response: {
    status: [200, 400],
    body: {
      message: "string"
    }
  },
  handler: async (req, res) => {
    const { path } = req.body;
    await deleteFile(path);
    return res?.json({
      message: "OK"
    });
  }
});

function deleteFile(path: string) {
  unlinkSync(getPath(path));
}
