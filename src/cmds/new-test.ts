import { ConfigPathResolver, loadConfig } from "@miqro/core";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

export const usage = `usage: [NODE_ENV=development] npx miqro new:test <identifier ex: TEST_SOMEFILE>`;

const testTemplates = {
  js: (category: string) =>
    `it("happy path", async () => {

})
`
}

export const main = (): void => {

  if (process.argv.length !== 4 || process.argv[3].length < 1) {
    throw new Error(usage);
  }

  const identifier = process.argv[3].toLocaleLowerCase();

  const split = identifier.split("_");

  const dots = split.filter(s => s.indexOf(".") !== -1);
  if (dots.length > 0) {
    throw new Error(`identifier cannot contain dots\narguments: <identifier ex: TEST_SOMETEST>`);
  }

  loadConfig();

  const path = resolve(ConfigPathResolver.getBaseDirname(), ...split.splice(0, split.length - 1));

  const filePath = resolve(path, `${split[0]}.test.js`);
  if (existsSync(filePath)) {
    throw new Error(`file ${filePath} already exists! doing nothing`);
  }

  console.log(`creating ${filePath}`);

  mkdirSync(path, {
    recursive: true
  });

  writeFileSync(filePath, testTemplates.js(split[0]));

  console.log(`file ${filePath} created`);
}
