import { APIRoute } from "@miqro/core";
import { relative } from "node:path";
import { BASE_PATH } from "../../../../../common/constants.server.js";
import { AdminRequest } from "../../../../../common/admin-interface.js";

export default {
  method: "POST",
  path: "/reload",
  description: "admin editor server reload endpoint. reloads the server without closing the port",
  middleware: [],
  request: {
    body: false
  },
  response: {
    status: [200, 400],
    body: {
      message: "string",
      reloadString: "string",
      migrations: "string[]",
      errors: {
        allowNull: true,
        type: "array",
        arrayType: "object",
        properties: {
          filePath: "string",
          error: "string"
        }
      }
    }
  },
  handler: async (req: AdminRequest, res) => {
    const errors = await req?.editor?.reload();
    return res.json({
      message: "OK",
      reloadString: req.uuid,
      migrations: req?.editor?.getMigrations().map(m => m.name),
      errors: parseInflateErrors(errors)
    });
  },
} as APIRoute;

export function parseInflateErrors(errors: {
  filePath: string;
  error: Error;
}[] | null) {
  return errors?.map(error => {
    return {
      filePath: relative(BASE_PATH, error.filePath),
      error: error.error.message
    }
  });
}
