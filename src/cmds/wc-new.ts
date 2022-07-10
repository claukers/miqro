import { existsSync, mkdir, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "../utils";

const indexHTML = {
  js: () => `<html>` +
    `<script type="text/javascript" src="app.bundle.min.js"></script>` +
    `<body>` +
    `<my-app></my-app>` +
    `</body>` +
    `</html>`
}

const indexComponent = {
  js: () => `const {define} = require("@miqro/web-components")\n` +
    `\n` +
    `define("my-app", function() {\n` +
    `  return "<p>Hello World!</p>";\n` +
    `});`,
  ts: () => `import {define, RenderFunctionThis} from "@miqro/web-components"\n` +
    `\n` +
    `define("my-app", function(this: RenderFunctionThis) {\n` +
    `  return "<p>Hello World!</p>";\n` +
    `});`
}

const webpackconfig = {
  js: () => `module.exports = {\n` +
    `  mode: "production",\n` +
    `  entry: "./src/index.js",\n` +
    `  output: {\n` +
    `    path: require("path").resolve(__dirname, 'build'),\n` +
    `    filename: "app.bundle.min.js"\n` +
    `  }\n` +
    `};`,
  ts: () => `module.exports = {\n` +
    `  mode: "production",\n` +
    `  entry: "./dist/index.js",\n` +
    `  output: {\n` +
    `    path: require("path").resolve(__dirname, 'build'),\n` +
    `    filename: "app.bundle.min.js"\n` +
    `  }\n` +
    `};`,
}

const gitignoreTemplate = {
  ts: () => `node_modules/
dist/
`,
  js: () => `node_modules/`
};

const packageTemplate = {
  ts: (name: string) =>
    `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "prebuild": "rm -Rf build/; rm -Rf dist/; mkdir build && cp -R public/ build/",
    "build": "tsc && webpack",
    "prestart": "npm run build",
    "start": "npx miqro serve build/ /"
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": "",
  "license": "ISC"
}`,
  js: (name: string) =>
    `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "",
  "private": true,
  "main": "src/main.js",
  "scripts": {
    "prebuild": "rm -Rf build/; rm -Rf dist/; mkdir build && cp -R public/ build/",
    "build": "webpack",
    "prestart": "npm run build",
    "start": "npx miqro serve build/ /"
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": "",
  "license": "ISC"
}`
}

export const usageJS = `usage: npx miqro new:front <identifier ex: NEW_APP>`;
export const usageTS = `usage: npx miqro new:front:typescript <identifier ex: NEW_APP>`;

export const mainJS = (typescript = false): void => {
  if (process.argv.length !== 4 || process.argv[3].length < 1) {
    throw new Error(typescript ? usageTS : usageJS);
  }

  const identifier = process.argv[3].toLocaleLowerCase();

  const appFolder = resolve(process.cwd(), identifier);

  if (existsSync(appFolder)) {
    throw new Error(`${appFolder} already exists!`);
  }

  console.log(`creating ${appFolder}`);

  mkdirSync(appFolder, {
    recursive: true
  });

  writeFileSync(resolve(appFolder, "package.json"), packageTemplate[typescript ? "ts" : "js"](identifier));

  execSync(
    `npm install miqro --save-dev`,
    {
      cwd: appFolder
    }
  );

  execSync(
    `npm install @miqro/web-components --save`,
    {
      cwd: appFolder
    }
  );

  if (typescript) {
    writeFileSync(resolve(appFolder, "tsconfig.json"), `{
  "compileOnSave": true,
  "compilerOptions": {
    "lib": ["es2021", "dom"],
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es2021",
    "strict": false,
    "outDir": "./dist/",
    "removeComments": true,
    "noImplicitAny": false,
    "preserveConstEnums": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "declaration": true
  },
  "exclude": [
    "node_modules",
    "test"
  ],
  "include": [
    "src"
  ]
}`);
    execSync(`npm install typescript --save-dev`, {
      cwd: appFolder
    });
    writeFileSync(resolve(appFolder, ".gitignore"), gitignoreTemplate.ts());
  } else {
    writeFileSync(resolve(appFolder, ".gitignore"), gitignoreTemplate.js());
  }

  execSync(`npm install webpack-cli --save-dev`, {
    cwd: appFolder
  });

  writeFileSync(resolve(appFolder, "webpack.config.js"), typescript ? webpackconfig.ts() : webpackconfig.js());

  mkdirSync(resolve(appFolder, "src"));
  mkdirSync(resolve(appFolder, "public"));

  writeFileSync(resolve(appFolder, "public", "index.html"), indexHTML.js());

  writeFileSync(resolve(appFolder, "src", "index" + (typescript ? ".ts" : ".js")), typescript ? indexComponent.ts() : indexComponent.js());

  console.log(`new project created on ${appFolder}`);

  console.log(`cd ${identifier}`);

  console.log(`npm run start`);
}

export const mainTS = (): void => mainJS(true);
