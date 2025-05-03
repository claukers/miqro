import { readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { extname, relative, resolve } from "path";

function getTypeFiles(dir, ret = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = resolve(dir, file);
    if (statSync(filePath).isDirectory()) {
      getTypeFiles(filePath, ret);
    } else {
      if (extname(file) === ".ts") {
        const subName = file.substring(0, file.length - ".ts".length);
        if (extname(subName) === ".d") {
          ret.push(relative(resolve(process.cwd(), "sea"), filePath));
        }
      }
    }
  }
  return ret;
}

const typeFiles = getTypeFiles("./sea/types");

const typesJson = {}
function addFile(filePath, installPath) {
  const typeFilePath = resolve(process.cwd(), "sea", filePath);
  typesJson[installPath ? installPath : filePath] = readFileSync(typeFilePath).toString("base64");
}

for (const typeFile of typeFiles) {
  addFile(typeFile);
}

writeFileSync(resolve(process.cwd(), "sea", "types.json"), JSON.stringify(typesJson));
