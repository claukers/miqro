import { MiddlewareConfig } from "../src/types.js";

export default {
  middleware: [(req) => {
    req.logger.log("\n\n\t\tPRE MIDDLEWARE\n\n");
  }],
  post: [(req) => {
    req.logger.log("\n\n\t\tPOST MIDDLEWARE\n\n");
  }],
} as MiddlewareConfig;
