import { APIRoute, Handler, Router, RouterHandlerOptions, SessionHandler } from "@miqro/core";
import { getAsset } from "../common/assets.js";

import { BASEEDITOR_PATH } from "../../editor/common/constants.js";
import EDITOR_AUTH from "../../editor/auth.js";

/*import writeAPI from "../../editor/http/admin/editor/api/fs/write.api.js";
import renameAPI from "../../editor/http/admin/editor/api/fs/rename.api.js";
import deleteAPI from "../../editor/http/admin/editor/api/fs/delete.api.js";
import readAPI from "../../editor/http/admin/editor/api/fs/read.api.js";
import scanAPI from "../../editor/http/admin/editor/api/fs/scan.api.js";
import restartAPI from "../../editor/http/admin/editor/api/server/restart.api.js";
import reloadAPI from "../../editor/http/admin/editor/api/server/reload.api.js";*/

import { AdminRequest, EditorAdminInterface } from "../../editor/common/admin-interface.js";
import { CONTENT_TYPE_MAP } from "../common/content-type.js";

export async function createEditorRouter(adminInterface: EditorAdminInterface): Promise<Router> {
  const router = new Router();

  router.use(async (req: AdminRequest, res) => {
    res.setHeader("x-uuid", req.uuid);
    req.editor = adminInterface;
  });

  const editorFont = Buffer.from(getAsset("editor-assets/font.ttf"));
  const editorJS = Buffer.from(getAsset("editor-assets/editor.bundle.js")).toString().trim();
  const editorCSS = Buffer.from(getAsset("editor-assets/style.css")).toString().trim().split("\n").map(l => l.trim()).filter(l => l).join("");

  const writeAPI = (await import("../../editor/http/admin/editor/api/fs/write.api.js")).default;
  const renameAPI = (await import("../../editor/http/admin/editor/api/fs/rename.api.js")).default;
  const deleteAPI = (await import("../../editor/http/admin/editor/api/fs/delete.api.js")).default;
  const readAPI = (await import("../../editor/http/admin/editor/api/fs/read.api.js")).default;
  const scanAPI = (await import("../../editor/http/admin/editor/api/fs/scan.api.js")).default;
  const restartAPI = (await import("../../editor/http/admin/editor/api/server/restart.api.js")).default;
  const reloadAPI = (await import("../../editor/http/admin/editor/api/server/reload.api.js")).default;

  const authHandler = SessionHandler(EDITOR_AUTH);

  const { EditorIndex } = await import("../../editor/common/editor-index.js");

  router.post(`${BASEEDITOR_PATH}/api/fs/write`, getHandler(authHandler, writeAPI));

  router.post(`${BASEEDITOR_PATH}/api/fs/rename`, getHandler(authHandler, renameAPI));

  router.post(`${BASEEDITOR_PATH}/api/fs/read`, getHandler(authHandler, readAPI));

  router.post(`${BASEEDITOR_PATH}/api/fs/delete`, getHandler(authHandler, deleteAPI));

  router.get(`${BASEEDITOR_PATH}/api/fs/scan`, getHandler(authHandler, scanAPI));

  router.post(`${BASEEDITOR_PATH}/api/server/restart`, getHandler(authHandler, restartAPI));

  router.post(`${BASEEDITOR_PATH}/api/server/reload`, getHandler(authHandler, reloadAPI));

  router.get(`${BASEEDITOR_PATH}/font.ttf`, async (_req, res) => {
    return await res.asyncEnd({
      status: 200,
      headers: {
        ["Content-Type"]: CONTENT_TYPE_MAP[".ttf"]
      },
      body: editorFont
    })
  });

  router.get(BASEEDITOR_PATH, [authHandler, EditorIndex(editorCSS, editorJS, false)]);



  router.use(async (req: AdminRequest, res) => {
    delete req.editor;
  });

  return router;
}

function getHandlerOptions(router: APIRoute): RouterHandlerOptions {
  return {
    description: router.description,
    //handler: router,
    middleware: router.middleware,
    request: router.request,
    response: router.response,
  };
}

function getHandler(auth: Handler, router: APIRoute): Router {
  const ret = new Router();
  ret.use(auth);
  ret.use(router.handler, undefined, undefined, getHandlerOptions(router));
  return ret;

}
