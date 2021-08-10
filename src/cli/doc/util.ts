import { ConfigPathResolver, GroupPolicy, Logger, ParseOptions } from "@miqro/core";
import { traverseAPIRouteDir } from "@miqro/handlers";
import { basename, resolve } from "path";

export const getDOCJSON = ({ dirname, subPath }: { dirname: string; subPath: string; }, logger: Logger): {
  path: string;
  methods: string[];
  description: string;
  params: false | ParseOptions | ParseOptions[];
  query: false | ParseOptions | ParseOptions[];
  body: false | ParseOptions | ParseOptions[];
  policy: GroupPolicy;
  results: ParseOptions | ParseOptions[];
  featureName: string;
}[] => {
  const apiTraverse = traverseAPIRouteDir(logger, basename(dirname).toUpperCase(), resolve(ConfigPathResolver.getBaseDirname(), dirname), subPath);
  const docJSON = Object.keys(apiTraverse).map(featureName => {
    const { path, methods, apiHandlerOptions } = apiTraverse[featureName];
    const { params, description, query, body, policy, results } = apiHandlerOptions;
    return {
      path,
      methods,
      params,
      description, query, body, policy, results,
      featureName
    };
  });
  return docJSON;
}
