import { ConfigPathResolver } from "@miqro/core";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const mainTemplates = {
  ts: (minimal = false) =>
    `${minimal ? `import { Context, APIRouter, App, checkEnvVariables, getLogger, ReadBuffer, JSONParser } from "@miqro/core";`: `import { APIRouter, App, checkEnvVariables, getLogger } from "@miqro/core";`}
${!minimal ? `import { middleware } from "@miqro/handlers";\nimport { resolve } from "path";` : ""}

/*
To be start as a main file
node file.js
*/

const [PORT] = checkEnvVariables(["PORT"], ["8080"]);

const logger = getLogger("server");

const app = new App();
${!minimal ? `app.use(middleware());\napp.use(APIRouter({
  dirname: resolve(__dirname, "api")
}, logger));` : `app.get("/api/health", [ReadBuffer(), JSONParser(), async (ctx: Context) => {
  ctx.json({
    status: "OK"
  });
}]);`}
app.listen(PORT, () => {
  logger.info("listening on " + PORT);
});
`,
  js: (minimal = false) =>
    `${minimal ? `const { APIRouter, App, checkEnvVariables, getLogger, ReadBuffer, JSONParser } = require("@miqro/core");`: `const { APIRouter, App, checkEnvVariables, getLogger } = require("@miqro/core");`}
${!minimal ? `const { middleware } = require("@miqro/handlers");
const { resolve } = require("path");`: ""}

/*
To be start as a main file
node file.js
*/

const [PORT] = checkEnvVariables(["PORT"], ["8080"]);

const logger = getLogger("server");

const app = new App();
${!minimal ? `app.use(middleware());\napp.use(APIRouter({
  dirname: resolve(__dirname, "api")
}, logger));` : `app.get("/api/health", [ReadBuffer(), JSONParser(), async (ctx) => {
  ctx.json({
    status: "OK"
  });
}]);`}
app.listen(PORT, () => {
  logger.info("listening on " + PORT);
});
`
}

export const main = (minimal = false): void => {

  if (process.argv.length !== 4 || process.argv[3].length < 1) {
    throw new Error(`arguments: <identifier ex: SRC_MAIN>`);
  }

  const identifier = process.argv[3].toLocaleLowerCase();

  const split = identifier.split("_");

  const dots = split.filter(s => s.indexOf(".") !== -1);
  if (dots.length > 0) {
    throw new Error(`identifier cannot contain dots\narguments: <identifier ex: SRC_MAIN>`);
  }

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

  writeFileSync(filePath, mainTemplates[ext](minimal));
}

export const mainMinimal = (): void => main(true);
