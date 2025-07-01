import { readdirSync, readFileSync, lstatSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function dirToBase64JSON(dir, ret = [], pre) {
  const files = readdirSync(dir);

  for (const file of files) {
    const path = join(dir, file);
    console.log(path);
    if (lstatSync(path).isDirectory()) {
      dirToBase64JSON(path, ret, pre);
    } else {
      const content = readFileSync(path).toString("base64");
      ret.push({
        path: pre ? join(pre, path) : path,
        content
      });
    }
  }
  return ret;
}



const out = [];

dirToBase64JSON("node_modules/cookie", out);
dirToBase64JSON("node_modules/@miqro/core", out);
dirToBase64JSON("node_modules/@miqro/request", out);
dirToBase64JSON("node_modules/@miqro/parser", out);
dirToBase64JSON("node_modules/@miqro/jsx-node", out);
dirToBase64JSON("node_modules/@miqro/jsx", out);
dirToBase64JSON("node_modules/@miqro/jsx-dom", out);
dirToBase64JSON("node_modules/@miqro/query", out);
dirToBase64JSON("node_modules/@miqro/runner", out);
dirToBase64JSON("node_modules/@miqro/test", out);
dirToBase64JSON("node_modules/@miqro/test-http", out);
dirToBase64JSON("node_modules/@types", out);

dirToBase64JSON("node_modules/jose", out);
dirToBase64JSON("node_modules/showdown", out);
dirToBase64JSON("build/esm", out, "node_modules/miqro");
out.push({
  path: "node_modules/miqro/package.json",
  content: readFileSync("package.json").toString("base64")
});

writeFileSync("sea/assets.base64.json", JSON.stringify(out));
