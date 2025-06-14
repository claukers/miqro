import { mkdir, rmdir, unlink, writeFile } from "node:fs";
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

export async function mkdirASync(path: string, options?: Partial<{ recursive: true; }>) {
  return new Promise<void>((resolve, reject) => {
    try {
      mkdir(path, options, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  })
}

export async function writeFileASync(path: string, body?) {
  return new Promise<void>((resolve, reject) => {
    try {
      writeFile(path, body, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function rmdirASync(path: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      rmdir(path, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function unlinkASync(path: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      unlink(path, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
