import { APIRoute, JSONParser } from "@miqro/core";
import { relative } from "node:path";
import { BASE_PATH } from "../../../../../common/constants.server.js";
import { AdminRequest } from "../../../../../../src/common/admin-interface.js";

export default {
  method: "POST",
  path: "/restart",
  description: "admin editor server restart endpoint",
  middleware: [JSONParser()],
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
    const errors = await req?.editor?.restart();
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
