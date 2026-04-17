import { WSConfig } from "../src/types.js";
import { LOG_SOCKET_PATH } from "./common/constants.js";
import { AdminRequest } from "./common/admin-interface.js";
import { ADMIN_EDITOR_AUTH_KEY } from "./auth.js";

export default {
  path: LOG_SOCKET_PATH,
  validate(req: AdminRequest) {
    const admin = req.editor;
    const cache = (admin ? admin.getCache() : req.server.cache);
    
    const KEY = cache.get(ADMIN_EDITOR_AUTH_KEY);
    const cookieToken = req.cookies[ADMIN_EDITOR_AUTH_KEY];

    return cookieToken && KEY && cookieToken === KEY ? true : false;
  },
} as WSConfig;
