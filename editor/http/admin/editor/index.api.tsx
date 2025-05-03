import { APIRoute, Response } from "@miqro/core";
import { scanDir } from "./api/fs/scan.api.js";
import { HTMLEncode } from "../../../common/html-encode.js";
import { AdminRequest } from "../../../common/admin-interface.js";

export default {
  description: "ADMIN EDITOR GUI",
  path: "/",
  method: "GET",
  handler: async (req: AdminRequest, res: Response) => {
    const admin = req.editor;
    const errors = admin ? admin.getInflateErrors() : [];
    const files = scanDir(req);
    const migrations = admin ? admin.getMigrations().map(m => m.name) : [];
    const services = admin ? admin.getServices() : ["."];

    return res.html("<!DOCTYPE html>" + String(<html>
      <head>
        <link rel="stylesheet" href="/admin/editor/style.css" />
      </head>
      <body>

        <script type="module" src="/admin/editor/editor.js" />
        <editor-component
          disableLog="true"
          disablePreview="true"
          disableReload="true"
          class="main-container"
          reloadString={`${req?.uuid}`}
          migrations={`${HTMLEncode(JSON.stringify(migrations))}`}
          services={`${HTMLEncode(JSON.stringify(services))}`}
          errors={`${HTMLEncode(JSON.stringify(errors))}`}
          files={`${HTMLEncode(JSON.stringify(files))}`}>
          <noscript>Enable JavaScript</noscript>
        </editor-component>
      </body></html>)
    );
  }
} as APIRoute;
