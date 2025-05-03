import { basename, extname } from "node:path";

export function describeFilePath(filePath: string) {
  const ext = extname(filePath);
  const fileName = basename(filePath);
  const name = fileName.substring(0, fileName.length - ext.length);
  const subExt = extname(name);
  const subName = name.substring(0, name.length - subExt.length);
  return {
    ext,
    fileName,
    name,
    subExt,
    subName,
    filePath
  };
}
