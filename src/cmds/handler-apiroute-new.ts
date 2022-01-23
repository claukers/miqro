import { ConfigPathResolver, loadConfig } from "@miqro/core";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const templates = {
  ts: (noMethod=false) =>
    noMethod ? `import { APIRoute } from "@miqro/core";

export default {
  method: "GET",
  handler: async (ctx) => {
    return {
      text: \`Hello\`
    }
  }
} as APIRoute;
` : `import { APIRoute } from "@miqro/core";

export default {
  handler: async (ctx) => {
    return {
      text: \`Hello\`
    }
  }
} as APIRoute;
`,
  js: (noMethod=false) =>
    noMethod ? `module.exports = {
  method: "GET
  handler: async (ctx) => {
    return {
      text: \`Hello\`
    }
  }
};
` : `module.exports = {
  handler: async (ctx) => {
    return {
      text: \`Hello\`
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

  const split = identifier.split("_").map(s=>s.trim()).filter(s=>s);

  const dots = split.filter(s => s.indexOf(".") !== -1);
  if (dots.length > 0) {
    throw new Error(`identifier cannot contain dots\narguments: <identifier ex: SRC_API_V1_HEALTH>`);
  }

  loadConfig();

  const path = resolve(ConfigPathResolver.getBaseDirname(), ...split.splice(0, split.length - 1));

  const ext = existsSync(resolve(ConfigPathResolver.getBaseDirname(), "tsconfig.json")) ? "ts" : "js";

  const noMethod = ["post", "get", "put", "delete", "patch", "options"].indexOf(split[0].toLocaleLowerCase()) === -1;

  const filePath = resolve(path, `${split[0]}.${ext}`);
  if (existsSync(filePath)) {
    throw new Error(`file ${filePath} already exists! doing nothing`);
  }

  console.log(`creating ${filePath}`);

  mkdirSync(path, {
    recursive: true
  });

  writeFileSync(filePath, templates[ext](noMethod));
}
