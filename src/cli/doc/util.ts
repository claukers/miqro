import { ConfigPathResolver, Logger, Method, ParseOptions } from "@miqro/core";
import { traverseAPIRouteDir } from "@miqro/core/dist/handler/api-router-utils";
import { basename, resolve } from "path";

export const getDOCJSON = ({ dirname, subPath }: { dirname: string; subPath: string; }, logger: Logger): {
  path: string;
  method: Method | Method[];
  description: string;
  params: false | ParseOptions | ParseOptions[];
  query: false | ParseOptions | ParseOptions[];
  body: false | ParseOptions | ParseOptions[];
  result: ParseOptions | ParseOptions[];
  featureName: string;
}[] => {
  const apiTraverse = traverseAPIRouteDir(logger, basename(dirname).toUpperCase(), resolve(ConfigPathResolver.getBaseDirname(), dirname), subPath);
  const docJSON = Object.keys(apiTraverse).map(featureName => {
    const { path, method, apiHandlerOptions } = apiTraverse[featureName];
    const { params, description, query, body, result } = apiHandlerOptions;
    return {
      path,
      method,
      params,
      description, query, body, result,
      featureName
    };
  });
  return docJSON;
}
