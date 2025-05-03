import { AuthConfig, ServerRequest } from "../src/types.js";
import { AdminRequest } from "./common/admin-interface.js";

export const ADMIN_EDITOR_AUTH_KEY = "$$ADMIN_EDITOR_AUTH_KEY$$";

export const ADMIN_EDITOR_AUTH_QUERY = "key";
export const ADMIN_EDITOR_AUTH_COOKIE = ADMIN_EDITOR_AUTH_KEY;

export default {
  authService: {
    verify: async (args) => {

      const adminInterface = (args.req as AdminRequest).editor;
      const serverInterface = (args.req as any as ServerRequest).server;
      const KEY = (adminInterface ? adminInterface.getCache() : serverInterface.cache).get<string>(ADMIN_EDITOR_AUTH_KEY);

      const validSesson = {
        username: "username",
        account: "account",
        groups: [],
        token: args.token
      };

      const queryToken = args.req.query[ADMIN_EDITOR_AUTH_QUERY];
      const cookieToken = args.req.cookies[ADMIN_EDITOR_AUTH_COOKIE];

      //console.log("\n\nqueryToken[%s] cookieToken[%s] KEY[%s]\n\n", queryToken, cookieToken, KEY);

      if (queryToken) {
        if (queryToken === KEY) {
          args.res.setCookie(ADMIN_EDITOR_AUTH_COOKIE, KEY, {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 31 * 12 * 500),
            httpOnly: true,

            //secure: true,
            path: "/",
            //sameSite: "strict"
          });
          args.req.searchParams.delete(ADMIN_EDITOR_AUTH_QUERY);
          const queryString = args.req.searchParams.toString();
          const redirect = args.req.path + (queryString ? "?" + queryString : "");
          await args.res.redirect(redirect);
          return validSesson;
        }
      } else if (cookieToken) {
        return cookieToken === KEY ? validSesson : null;
      }
      return null;
    },
  }
} as AuthConfig;
