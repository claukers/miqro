import { APIRouter, ConfigPathResolver, GroupPolicy, Logger, Method, SessionHandlerOptions } from "@miqro/core";
import { traverseAPIRouteDir } from "@miqro/core/dist/common/api-router-utils";
import { RouterJSONDoc } from "@miqro/core/dist/common/router-utils";
import { ParserArgs } from "@miqro/parser";
import { basename, resolve } from "path";

interface FakeParserArgs {
  description?: string;
  options: boolean | ParserArgs | ParserArgs[] | undefined
}

export const getDOCJSON = ({ dirname, subPath, apiName }: { apiName?: string; dirname: string; subPath: string; }, logger: Logger): RouterJSONDoc => {
  //const apiTraverse = traverseAPIRouteDir(basename(dirname).toUpperCase(), resolve(ConfigPathResolver.getBaseDirname(), dirname), subPath, undefined, logger);
  console.log(apiName);
  const router = APIRouter({
    apiName,
    dirname: resolve(ConfigPathResolver.getBaseDirname(), dirname),
    path: subPath
  }, logger);
  return router.getJSONDoc();
}
