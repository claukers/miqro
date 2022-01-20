import { ConfigPathResolver, ParseOptions, Logger, SessionHandlerOptions, GroupPolicy, Method } from "@miqro/core";
import { traverseAPIRouteDir } from "@miqro/core/dist/common/api-router-utils";
import { basename, resolve } from "path";

export const getDOCJSON = ({ dirname, subPath }: { dirname: string; subPath: string; }, logger: Logger): {
  path?: string | string[];
  method?: Method | Method[];
  description?: string;
  policy?: GroupPolicy;
  headers?: ParseOptions | ParseOptions[];
  session?: false | true | SessionHandlerOptions;
  params?: false | ParseOptions | ParseOptions[];
  query?: false | ParseOptions | ParseOptions[];
  body?: false | ParseOptions | ParseOptions[];
  result?: ParseOptions | ParseOptions[];
  featureName: string;
}[] => {
  const apiTraverse = traverseAPIRouteDir(basename(dirname).toUpperCase(), resolve(ConfigPathResolver.getBaseDirname(), dirname), subPath, undefined, logger);
  const docJSON = Object.keys(apiTraverse).map(featureName => {
    const { path, method, options } = apiTraverse[featureName];
    const { session, policy, description } = options ? options : { session: undefined, policy: undefined, description: undefined };
    const { params, query, body, headers } = options && options.request ? options.request : { params: undefined, query: undefined, body: undefined, headers: undefined };
    const result = options && options.response !== true ? options.response : undefined;
    return {
      path,
      method,
      headers,
      session: session ? typeof session === "function" ? true : session : false,
      policy,
      params,
      description, query, body, result,
      featureName
    };
  });
  return docJSON;
}
