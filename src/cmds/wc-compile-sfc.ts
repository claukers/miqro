import {basename, dirname, extname, relative, resolve} from "path";
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync} from "fs";
import {parseXML2JSON} from "../utils/xml.js";
import {extractFlags} from "../utils";

export const usage = "npx miqro sfc <sfcDir> <outDir> [-m @miqro/web-components] [-e \".js\"]";

const DATA_SHADOW_ROOT_MODE = "DATA-SHADOW-ROOT-MODE";

export const main = async () => {

  const flags = extractFlags(process.argv.slice(3), {
    flags: {
      "m": {
        description: "module to require defineFunction",
        hasValue: true
      },
      "o": {
        description: "extension of output",
        hasValue: true
      },
      "i": {
        description: "extension of input",
        hasValue: true
      },
      "r": {
        description: "remove output files",
        hasValue: false
      }
    }
  });
  if (flags.files.length !== 2) {
    throw new Error(usage);
  }

  const extension = flags.flags.o ? flags.flags.o as string : ".js";

  const inputExtension = flags.flags.i ? flags.flags.i as string : ".sfc";

  const webComponentsModule = flags.flags.m ? flags.flags.m as string : "@miqro/web-components";

  const defineRequireString = extension === ".ts" ?
    `import {define} from "${webComponentsModule}"` :
    `import {define} from "${webComponentsModule}";`

  const componentRequireString = extension === ".ts" ?
    `import {FunctionComponentThis} from "${webComponentsModule}"` : ""

  const sfcDir = resolve(process.cwd(), flags.files[0]);
  const outDir = resolve(process.cwd(), flags.files[1]);

  if (!statSync(sfcDir).isDirectory() || !statSync(outDir).isDirectory()) {
    throw new Error(usage);
  }

  const tE: (() => Promise<void>)[] = [];

  function recursiveDir(folder: string) {
    const files = readdirSync(folder);
    for (const file of files) {
      const filePath = resolve(folder, file);
      if (statSync(filePath).isDirectory()) {
        recursiveDir(filePath);
      } else {
        if (extname(filePath) === inputExtension) {
          tE.push(async function () {
            try {
              const outMainFileName = basename(filePath.substring(0, filePath.length - inputExtension.length) + extension);
              const outFileName = basename(filePath.substring(0, filePath.length - inputExtension.length) + "-component" + extension);
              //const outTemplateFileName = basename(filePath.substring(0, filePath.length - inputExtension.length) + ".html");
              const realOutFileDirname = resolve(outDir, relative(sfcDir, dirname(filePath)));
              const realOutFilePath = resolve(realOutFileDirname, outFileName);
              //const realTemplateOutFilePath = resolve(realOutFileDirname, outTemplateFileName);
              const realMainOutFilePath = resolve(realOutFileDirname, outMainFileName);

              if (flags.flags.r !== undefined) {
                console.log("%s\n\tremoving %s\n\tremoving %s", filePath, realOutFilePath, realMainOutFilePath);
                unlinkSync(realOutFilePath);
                //unlinkSync(realTemplateOutFilePath);
                unlinkSync(realMainOutFilePath);
              } else {
                console.log("%s ->\n\t%s\n\t%s", filePath, realOutFilePath, realMainOutFilePath);
                if (!existsSync(realOutFileDirname)) {
                  mkdirSync(realOutFileDirname, {
                    recursive: true
                  });
                }
                const [jsContent, mainJS] = await compileSFC(filePath, {
                  defineRequireString,
                  componentRequireString
                });
                writeFileSync(realOutFilePath, jsContent);
                //writeFileSync(realTemplateOutFilePath, templateContent);

                const requireInput = "./" + relative(dirname(realMainOutFilePath), realOutFilePath);
                //const requireTemplateInput = relative(dirname(realMainOutFilePath), realTemplateOutFilePath);
                const commonJSANDESM = requireInput.substring(0, requireInput.length - extension.length) + ".js";

                writeFileSync(realMainOutFilePath, mainJS(commonJSANDESM));
              }
            } catch (e) {
              console.error(e);
            }
          });
        }
      }
    }
  }

  recursiveDir(sfcDir);
  await Promise.allSettled(tE.map(t => t()));
}

async function compileSFC(sfcPath: string, requireStrings: { defineRequireString: string; componentRequireString: string; }, extension: string = ".js"): Promise<[string, ((path: string) => string)]> {
  const json = await parseXML2JSON(readFileSync(sfcPath).toString());

  json.children = json.children.filter((c: any) => c.name !== "TEXT");

  if (json.children.length !== 1) {
    throw new Error("bad sfc structure(0) for " + sfcPath);
  }
  json.children[0].children = json.children[0].children.filter((c: any) => c.name !== "TEXT");

  if (json.children[0].children.length !== 2) {
    throw new Error("bad sfc structure(1) for " + sfcPath);
  }

  const componentName = json.children[0].name.toLowerCase();
  const componentTemplateTag = json.children[0].children[0];
  const dataShadowRootMode = json.children[0].attributes[DATA_SHADOW_ROOT_MODE] ? json.children[0].attributes[DATA_SHADOW_ROOT_MODE] : undefined;

  let modeArg: undefined | boolean | {
    mode: "closed" | "open"
  };


  switch (dataShadowRootMode) {
    case "false":
      modeArg = false;
      break;
    case "true":
    case "close":
      modeArg = {mode: "closed"};
      break;
    case "open":
      modeArg = {mode: "open"};
      break;
  }

  const componentScriptTag = json.children[0].children[1];
  if (componentTemplateTag.name !== "TEMPLATE" || componentScriptTag.name !== "SCRIPT") {
    throw new Error("bad sfc structure(2) for " + sfcPath);
  }

  /*console.dir(json, {
    depth: 10
  });*/

  if (componentScriptTag.children.length !== 1 || componentScriptTag.children[0].type !== "text") {
    throw new Error("bad sfc structure(3) for " + sfcPath);
  }

  const jsContent = `${componentScriptTag.children[0].text}`;
  //console.log("[" + jsContent + "]");

  const template = componentTemplateTag.children.map((tag: any) => tagToString(tag))
    .join("");//.split("\n").map((l: string) => l.trim()).join("");

  const outFileContent = `${requireStrings.componentRequireString}\n\n${jsContent}`;

  //console.log(outFileContent);

  return [
    outFileContent,
    (jsContentPath: string) =>
      `${requireStrings.defineRequireString ? `${requireStrings.defineRequireString}\n` : ""}` +
      `import render from "${jsContentPath}";\n\n` +
      `define("${componentName}", render, ${JSON.stringify({
        template,
        ...(dataShadowRootMode === undefined ? {} : {
          shadowInit: modeArg
        })
      })});`
  ];
}

function getAttributes(tag: any): string {
  const attributes = Object.keys(tag.attributes);
  let ret = "";
  for (const attribute of attributes) {
    if (ret === "") {
      ret = `${attribute.toLowerCase()}="${tag.attributes[attribute]}"`
    } else {
      ret += ` ${attribute.toLowerCase()}="${tag.attributes[attribute]}"`
    }
  }
  return ret;
}

function tagToString(tag: any) {
  if (tag.type === "text") {
    return tag.text ? tag.text : "";
  } else if (tag.type === "comment") {
    return `<!--${tag.text}-->`;
  } else if (tag.isSelfClosing) {
    const attrs = getAttributes(tag);
    return `<${tag.name.toLowerCase()}${attrs ? ` ${attrs}` : ""}/>`
  } else {
    const attrs = getAttributes(tag);
    return `<${tag.name.toLowerCase()}${attrs ? ` ${attrs}` : ""}>${tag.children.map((c: any) => tagToString(c)).join("\n")}</${tag.name.toLowerCase()}>`
  }
}
