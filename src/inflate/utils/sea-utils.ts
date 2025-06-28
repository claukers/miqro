import { Router } from "@miqro/core";
import { describeFilePath } from "../../common/fs.js";
import { getRoutes } from "../../services/utils/get-route.js";
// import { assertGlobalTampered } from "../../services/globals.js";
import { dirname, join, relative } from "node:path";

export async function appendAPIModule(router: Router, dir: string, filePath: string, module: any) {
  const file = describeFilePath(filePath);
  const routes = getRoutes(join("/", dirname(relative(dir, file.filePath))), file.subName, module);
  for (const r of routes) {
    // router.use(assertGlobalTampered);
    router.use(module.handler, r.path, r.method as any, r.options);
  }
}
