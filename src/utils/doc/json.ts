import { APIRouter, ConfigPathResolver, Logger, RouterJSONDoc } from "@miqro/core";
import { ParserArgs } from "@miqro/parser";
import { resolve } from "path";

interface FakeParserArgs {
  description?: string;
  options: boolean | ParserArgs | ParserArgs[] | undefined
}

export const getDOCJSON = async ({ dirname, subPath, apiName }: { apiName?: string; dirname: string; subPath: string; }, logger?: Logger): Promise<RouterJSONDoc> => {
  //const apiTraverse = traverseAPIRouteDir(basename(dirname).toUpperCase(), resolve(ConfigPathResolver.getBaseDirname(), dirname), subPath, undefined, logger);
  const router = await APIRouter({
    apiName,
    dirname: resolve(ConfigPathResolver.getBaseDirname(), dirname),
    path: subPath
  }, logger);
  return router.getJSONDoc();
}
