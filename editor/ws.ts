import { WSConfig } from "../src/types.js";
import { LOG_SOCKET_PATH } from "./common/constants.js";
import { AdminRequest } from "./common/admin-interface.js";

export default {
  path: LOG_SOCKET_PATH,
  validate(req: AdminRequest) {
    const admin = req.editor;
    const cache = (admin ? admin.getCache() : req.server.cache);
    
    const KEY = cache.get("AUTH_KEY");
    const cookieToken = req.cookies["auth"];
    return cookieToken === KEY ? true : false;
  },
} as WSConfig;
