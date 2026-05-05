import { APIRoute, normalizePath, RouterHandlerOptions } from "@miqro/core";
import { join } from "node:path";

export interface RouterUseCall {
  path?: string;
  method?: string;
  inflatePath: string;
  defaultInflatePath: string;
  options?: RouterHandlerOptions;
}

export function getRoutes(prePath: string, defaultPath: string, apiOptions?: Partial<APIRoute>): RouterUseCall[] {
  const ret: RouterUseCall[] = [];
  const path = apiOptions && apiOptions.path ? apiOptions.path : defaultPath;
  const defaultInflatePath = join(prePath, defaultPath);
  const method = apiOptions && apiOptions.method ? apiOptions.method : "GET";

  const methods = method instanceof Array ? method : [method];
  const paths = path instanceof Array ? path : [path];

  if (apiOptions && apiOptions.path === null) {
    for (const m of methods) {
      ret.push({
        options: {
          apiName: apiOptions?.apiName,
          description: apiOptions?.description,
          identifier: apiOptions?.identifier,
          middleware: apiOptions?.middleware,
          name: apiOptions?.name,
          parser: apiOptions?.parser,
          policy: apiOptions?.policy,
          request: apiOptions?.request,
          response: apiOptions?.response ?? {
            etag: true
          },
          session: apiOptions?.session
        },
        inflatePath: defaultInflatePath,
        defaultInflatePath,
        method: m.toLocaleLowerCase() !== "use" ? m.toUpperCase() : undefined,
        path: undefined
      });
    }
  } else {
    for (const p of paths) {
      for (const m of methods) {
        ret.push({
          options: {
            apiName: apiOptions?.apiName,
            description: apiOptions?.description,
            identifier: apiOptions?.identifier,
            middleware: apiOptions?.middleware,
            name: apiOptions?.name,
            parser: apiOptions?.parser,
            policy: apiOptions?.policy,
            request: apiOptions?.request,
            response: apiOptions?.response ?? {
              etag: true
            },
            session: apiOptions?.session
          },
          inflatePath: p !== "/" ? join(prePath, p) : defaultInflatePath,
          defaultInflatePath,
          method: m.toLocaleLowerCase() !== "use" ? m.toUpperCase() : undefined,
          path: normalizePath(join(prePath, p))
        });
      }
    }
  }



  return ret;
}
