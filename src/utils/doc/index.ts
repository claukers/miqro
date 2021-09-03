import { ConfigPathResolver, Logger, Method, ParseOptions } from "@miqro/core";
import { traverseAPIRouteDir } from "@miqro/core/dist/handler/api-router-utils";
import { basename, resolve } from "path";

export const getDOCJSON = ({ dirname, subPath }: { dirname: string; subPath: string; }, logger: Logger): {
  path: string | string[];
  method: Method | Method[];
  description: string;
  params: false | ParseOptions | ParseOptions[];
  query: false | ParseOptions | ParseOptions[];
  body: false | ParseOptions | ParseOptions[];
  result: ParseOptions | ParseOptions[];
  featureName: string;
}[] => {
  const apiTraverse = traverseAPIRouteDir(basename(dirname).toUpperCase(), resolve(ConfigPathResolver.getBaseDirname(), dirname), subPath, undefined, logger);
  const docJSON = Object.keys(apiTraverse).map(featureName => {
    const { path, method, description, params, query, body, result } = apiTraverse[featureName];
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
