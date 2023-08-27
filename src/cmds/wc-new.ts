import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "../utils";

const indexHTML = {
  js: () => `<html>` +
    `<script type="text/javascript" src="app.bundle.min.js"></script>` +
    `<body>` +
    `<app-component></app-component>` +
    `</body>` +
    `</html>`
}

const indexComponent = {
  ts: () => `import WebComponents, {JSX, define, RenderFunctionThis} from "@miqro/web-components"\n` +
    `\n` +
    `define("app-component", function(this: RenderFunctionThis): JSX.Element {\n` +
    `  return (<p>Hello World!</p>);\n` +
    `});\n`
}

const webpackconfig = {
  ts: () => `const mode = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
console.log("webpack mode [%s]", mode);
module.exports = {` +
    `  mode: "production",` +
    `  entry: "./dist/index.js",` +
    `  output: {` +
    `    path: require("path").resolve(__dirname, 'build'),` +
    `    filename: "app.bundle.min.js"` +
    `  }` +
    `};`,
}

const gitignoreTemplate = {
  ts: () => `node_modules/
dist/
`
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
    "build": "tsc && NODE_ENV=production webpack",
    "build:dev": "tsc && webpack",
    "prestart": "npm run build:dev",
    "start": "miqro serve build/ / --port 3000 & miqro watch src/ \\"npm run build:dev\\""
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": "",
  "license": "ISC"
}`
}

export const usageTS = `usage: npx miqro new:front <identifier ex: NEW_APP>`;

export const mainTS = (): void => {
  if (process.argv.length !== 4 || process.argv[3].length < 1) {
    throw new Error(usageTS);
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

  writeFileSync(resolve(appFolder, "package.json"), packageTemplate["ts"](identifier));

  execSync(
    `npm install miqro --save-dev`,
    {
      cwd: appFolder
    }
  );

  /*execSync(
    `npm install @miqro/web-components --save`,
    {
      cwd: appFolder
    }
  );*/


  writeFileSync(resolve(appFolder, "tsconfig.json"), `{
  "compileOnSave": true,
  "compilerOptions": {
    "lib": ["es2021", "dom"],
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es2021",
    "strict": false,
    "outDir": "./dist/",
    "jsx": "react",
    "jsxFactory": "WebComponents.jsxFactory",
    "jsxFragmentFactory": "WebComponents.jsxFragmentFactory"
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


  execSync(`npm install webpack-cli --save-dev`, {
    cwd: appFolder
  });

  writeFileSync(resolve(appFolder, "webpack.config.js"), webpackconfig.ts());

  mkdirSync(resolve(appFolder, "src"));
  mkdirSync(resolve(appFolder, "public"));

  writeFileSync(resolve(appFolder, "public", "index.html"), indexHTML.js());

  writeFileSync(resolve(appFolder, "src", "index" + (".tsx")), indexComponent.ts());

  console.log(`new project created on ${appFolder}`);

  console.log(`cd ${identifier}`);

  console.log(`npm run start`);
}
