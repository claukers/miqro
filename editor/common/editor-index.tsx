import { scanDir } from "../http/admin/editor/api/fs/scan.api.js";
import { parseInflateErrors } from "../http/admin/editor/api/server/restart.api.js";
import { AdminRequest } from "./admin-interface.js";
import { HTMLEncode } from "./html-encode.js";

export function EditorIndex(editorCSS: string, editorJS: string, enableHotReload: boolean) {
  return async function editorIndex(req: AdminRequest, res) {
    const admin = req.editor;

    const errors = parseInflateErrors(admin ? admin.getInflateErrors() : []);
    const files = scanDir(req);
    const migrations = admin ? admin.getMigrations().map(m => m.name) : [];
    const services = admin ? admin.getServices() : ["."];
    const hotReload = enableHotReload ? (admin ? admin.getHotReloadHTML() : "") : "";
    res.html(`<!DOCTYPE html><html><body><style>${editorCSS}</style><script type="module">${editorJS}</script><editor-component class="main-container" reloadstring="${req.uuid}" migrations="${HTMLEncode(JSON.stringify(migrations))}" services="${HTMLEncode(JSON.stringify(services))}" errors="${HTMLEncode(JSON.stringify(errors))}" files="${HTMLEncode(JSON.stringify(files))}"><noscript>Enable JavaScript</noscript></editor-component>${hotReload}</body></html>`)
  }
}
