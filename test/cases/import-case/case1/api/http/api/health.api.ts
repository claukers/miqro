import { APIRoute } from "@miqro/core";

export default {
  method: "GET",
  path: "/health",
  response: true,
  handler: async (req, res) => {
    req.logger.error("HERE");
    return {
      status: 200,
      body: {
        status: "OK"
      }
    }
  }
} as APIRoute;
