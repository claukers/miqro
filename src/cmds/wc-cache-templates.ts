import {readdirSync, readFileSync, statSync, writeFileSync} from "fs";
import {extname, relative, resolve} from "path";
import {format} from "util";

function recursiveSearch(path: string, found: string[] = []) {
  const files = readdirSync(path);
  for (const file of files) {
    const filePath = resolve(path, file);
    if (statSync(filePath).isDirectory()) {
      recursiveSearch(filePath, found);
    } else {
      const ext = extname(filePath);
      if (ext === ".html" || ext === ".htm") {
        found.push(filePath);
      }
    }
  }
  return found;
}

export const usage = "npx miqro generate:template:cache <src> <out.js>";

export const main = async () => {

  if (process.argv.length !== 5 || process.argv[3].length < 1 || process.argv[4].length < 1) {
    throw new Error(usage);
  }

  const directory = process.argv[3].toLocaleLowerCase();
  const outfile = process.argv[4].toLocaleLowerCase();

  const path = resolve(process.cwd(), directory);
  const outFilePath = resolve(process.cwd(), outfile);

  if (!statSync(path).isDirectory()) {
    throw new Error(format("%s not a directory", path));
  }
  const foundTemplates = recursiveSearch(path);
  console.log("caching %o", foundTemplates);
  console.log("to %s", outFilePath);
  const cache: {
    [key: string]: {
      location: {
        url: string
      },
      content: string
    }
  } = {};
  for (const template of foundTemplates) {
    if (template) {
      const url = relative(path, template);
      const content = readFileSync(template).toString("utf-8");
      cache[url] = {
        location: {
          url
        },
        content
      };
    }
  }
  writeFileSync(outFilePath, `module.exports = ${JSON.stringify(cache, undefined, 0)};`
  );
}
