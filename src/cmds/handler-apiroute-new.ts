import { ConfigPathResolver, loadConfig } from "@miqro/core";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const templates = {
  ts: (path: string) =>
    `import { APIRoute, Context } from "@miqro/core";

const route: APIRoute = {
  path: "${path}",
  method: "POST",
  query: false,
  body: [
    {
      options: {
        name: "string"
      },
      mode: "no_extra"
    }
  ],
  params: false,
  result: [
    {
      options: {
        text: "string"
      },
      mode: "remove_extra"
    }
  ],
  handler: async (ctx: Context) => {
    return {
      text: \`Hello \${ctx.body.name}!\`
    }
  }
};

export default route;
`,
  js: (path: string) =>
    `module.exports = {
  path: "${path}",
  method: "POST",
  query: false,
  body: [
    {
      options: {
        name: "string"
      },
      mode: "no_extra"
    }
  ],
  params: false,
  result: [
    {
      options: {
        text: "string"
      },
      mode: "remove_extra"
    }
  ],
  handler: async (ctx) => {
    return {
      text: \`Hello \${ctx.body.name}!\`
    }
  }
};
`
}

export const main = (): void => {

  if (process.argv.length !== 4 || process.argv[3].length < 1) {
    throw new Error(`arguments: <identifier ex: SRC_API_V1_HEALTH>`);
  }

  const identifier = process.argv[3].toLocaleLowerCase();

  const split = identifier.split("_");

  const dots = split.filter(s => s.indexOf(".") !== -1);
  if (dots.length > 0) {
    throw new Error(`identifier cannot contain dots\narguments: <identifier ex: SRC_API_V1_HEALTH>`);
  }

  loadConfig();

  const path = resolve(ConfigPathResolver.getBaseDirname(), ...split.splice(0, split.length - 1));

  const ext = existsSync(resolve(ConfigPathResolver.getBaseDirname(), "tsconfig.json")) ? "ts" : "js";

  const filePath = resolve(path, `${split[0]}.${ext}`);
  if (existsSync(filePath)) {
    throw new Error(`file ${filePath} already exists! doing nothing`);
  }

  console.log(`creating ${filePath}`);

  mkdirSync(path, {
    recursive: true
  });

  writeFileSync(filePath, templates[ext](`/${split[0]}`));
}
