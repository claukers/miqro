import * as jsx from "@miqro/jsx";
import JSX from "@miqro/jsx";

import { APIRoute, Response } from "@miqro/core";
import { scanDir } from "./api/fs/scan.api.js";
import { HTMLEncode } from "../../../common/html-encode.js";
import { AdminRequest } from "../../../common/admin-interface.js";
import { jsx2HTML } from "../../../../src/lib.js";

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

    return res.html("<!DOCTYPE html>" + jsx2HTML(<html>
      <head>
        <link rel="stylesheet" href="/admin/editor/style.css" />
      </head>
      <body>

        <script type="module" src="/admin/editor/editor.js" />
        <editor-component
          disablelog="true"
          disablepreview="true"
          disablereload="true"
          class="main-container"
          reloadstring={`${req?.uuid}`}
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
