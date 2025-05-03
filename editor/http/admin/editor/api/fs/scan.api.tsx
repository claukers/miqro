import { APIRoute } from "@miqro/core";
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { BASE_PATH } from "../../../../../common/constants.server.js";
import { AdminRequest } from "../../../../../common/admin-interface.js";

export interface ScannedFile {
  filePath: string;
  ext: string;
  fileName: string;
  name: string;
  subExt: string;
  subName: string;
  language: string;
  previewPath?: string;
  dirs: string[];
  apiPreview?: {
    path: string;
    method: string;
  }[];
}

export default {
  method: "GET",
  path: "/scan",
  description: "admin editor file scan endpoint",
  middleware: [server.middleware.json()],
  request: {
    body: false
  },
  response: {
    status: [200, 400]
  },
  handler: async (req: AdminRequest, res) => {
    const admin = req.editor;
    const services = admin ? admin.getServices() : ["."];
    return res.json({
      files: scanDir(req),
      services
    });
  },
} as APIRoute;

export function scanDir(req: AdminRequest, basePath: string = BASE_PATH, ret: ScannedFile[] = []): ScannedFile[] {
  const admin = req.editor;
  const services = admin ? admin.getServices() : ["."];
  services.forEach(service => {
    scanDirInternal(req, resolve(basePath, service), ret);
  });
  return ret;
}

function scanDirInternal(req, path: string = BASE_PATH, ret: ScannedFile[] = []): ScannedFile[] {
  if (!existsSync(path)) {
    return ret;
  }
  const files = readdirSync(path);
  for (const file of files) {
    if (shouldIgnoreFile(file)) {
      continue;
    }
    const filePath = resolve(path, file);
    if (statSync(filePath).isDirectory()) {
      scanDirInternal(req, filePath, ret);
      continue;
    } else {
      const ext = extname(filePath);
      const fileName = basename(filePath);
      const name = fileName.substring(0, fileName.length - ext.length);
      const subExt = extname(name);
      const subName = name.substring(0, name.length - subExt.length);

      ret.push({
        dirs: getFileDirs(relative(BASE_PATH, filePath)),
        language: getLanguage(filePath),
        filePath: relative(BASE_PATH, filePath),
        ext,
        fileName,
        name,
        subExt,
        subName,
        previewPath: getPreview(req, filePath),
        apiPreview: getAPIPreview(req, filePath)
      });
    }
  }
  return ret;
}

function shouldIgnoreFile(file) {
  return file === ".git" || file === ".types" || file === ".DS_Store" || file === "node_modules";
}

function getFileDirs(filePath: string): string[] {
  const dirs: string[] = [];
  let dir = dirname(filePath);
  while (dir !== sep && dir !== "" && dir !== "." && dir !== BASE_PATH) {

    dirs.push(dir);
    dir = dirname(dir);

  }
  return dirs.reverse().map(d => basename(d));

}

export function getLanguage(filePath: string): string {
  const ext = extname(filePath);
  const fileName = basename(filePath);
  switch (ext.toLocaleLowerCase()) {
    case ".py":
      return "python";
    case ".sh":
      return "bash";
    case ".webmanifest":
    case ".json":
      return "json";
    case ".xml":
      return "xml";
    case ".jsx":
    case ".js":
      return "javascript";
    case ".tsx":
    case ".ts":
    case "d.ts":
      return "typescript";
    case ".htm":
    case ".html":
      return "html";
    case ".scss":
    case ".css":
      return "css";
    case ".md":
      return "markdown";
    case ".c":
      return "c";
    case ".h":
    case ".cpp":
      return "cpp";
    case ".yml":
    case ".yaml":
      return "yaml";
    case ".txt":
    case ".log":
      return "text";
    default:
      switch (fileName) {
        case "dockerfile":
          return "dockerfile";
        case ".gitignore":
          return "text";
      }
      return "text";
  }
}

export function getPreview(req: AdminRequest, filePath: string): undefined | string {
  const admin = req.editor;
  const inflateData = admin ? admin.getRouteFileMap()[filePath] : undefined;
  if (inflateData) {
    return inflateData.previewMethod === "html" ? inflateData.routes[0].path : undefined;
  }
  return undefined;
}

export function getAPIPreview(req, filePath: string): undefined | {
  path: string;
  method: string;
}[] {
  const admin = req.editor;
  const inflateData = admin ? admin.getRouteFileMap()[filePath] : undefined;
  if (inflateData) {
    return inflateData.previewMethod === "api" ? inflateData.routes.map(r => {
      return {
        path: r.path,
        method: r.method ? r.method : "GET"
      };
    }) : undefined;
  }
  return undefined;
}
