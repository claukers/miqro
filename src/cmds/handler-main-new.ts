import { ConfigPathResolver, loadConfig } from "@miqro/core";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const mainTemplates = {
  ts: () =>
    `import { APIRouter, App, checkEnvVariables, getLogger, middleware } from "@miqro/core";
import { resolve } from "path";

/*
To be start as a main file
node file.js
*/

const [PORT] = checkEnvVariables(["PORT"], ["8080"]);

const logger = getLogger("server");

const app = new App();
app.use(middleware());
app.use(APIRouter({
  dirname: resolve(__dirname, "api")
}, logger));
app.listen(PORT, () => {
  logger.info("listening on " + PORT);
});
`,
  js: () =>
    `const { APIRouter, App, checkEnvVariables, getLogger, middleware } = require("@miqro/core");
const { resolve } = require("path");

/*
To be start as a main file
node file.js
*/

const [PORT] = checkEnvVariables(["PORT"], ["8080"]);

const logger = getLogger("server");

const app = new App();
app.use(middleware());
app.use(APIRouter({
  dirname: resolve(__dirname, "api")
}, logger));
app.listen(PORT, () => {
  logger.info("listening on " + PORT);
});
`
}

export const main = (): void => {

  if (process.argv.length !== 4 || process.argv[3].length < 1) {
    throw new Error(`arguments: <identifier ex: SRC_MAIN>`);
  }

  const identifier = process.argv[3].toLocaleLowerCase();

  const split = identifier.split("_");

  const dots = split.filter(s => s.indexOf(".") !== -1);
  if (dots.length > 0) {
    throw new Error(`identifier cannot contain dots\narguments: <identifier ex: SRC_MAIN>`);
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

  writeFileSync(filePath, mainTemplates[ext]());

  console.log(`file ${filePath} created`);
}
