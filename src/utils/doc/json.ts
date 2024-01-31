import { APIRouter, ConfigPathResolver, Logger, RouterJSONDoc } from "@miqro/core";
import { resolve } from "path";

export const getDOCJSON = async ({ dirname, subPath, apiName, ignore }: { ignore?: string[], apiName?: string; dirname: string; subPath: string; }, logger?: Logger): Promise<RouterJSONDoc> => {
  //const apiTraverse = traverseAPIRouteDir(basename(dirname).toUpperCase(), resolve(ConfigPathResolver.getBaseDirname(), dirname), subPath, undefined, logger);
  const router = await APIRouter({
    apiName,
    dirname: resolve(ConfigPathResolver.getBaseDirname(), dirname),
    path: subPath,
    ignore
  }, logger);
  return router.getJSONDoc();
}
