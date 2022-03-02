import {existsSync, mkdirSync, writeFileSync} from "fs";
import {resolve} from "path";
import {execSync} from "../utils";

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
    "prebuild": "rm -Rf dist/;",
    "build": "tsc",
    "prestart": "npm run build",
    "start": "node dist/main.js",
    "pretest": "npm run build",
    "test": "miqro-test -r test/ -n"
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
    "start": "node src/main.js",
    "test": "miqro-test -r test/ -n"
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": "",
  "license": "ISC"
}`
}

export const usageJS = `usage: npx miqro new <identifier ex: NEW_APP>`;
export const usageTS = `usage: npx miqro new:typescript <identifier ex: NEW_APP>`;

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
    `npm install @miqro/core --save`,
    {
      cwd: appFolder
    }
  );

  if (typescript) {
    writeFileSync(resolve(appFolder, "tsconfig.json"), `{
  "compileOnSave": true,
  "compilerOptions": {
    "lib": ["es2021"],
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
    execSync(`npm install @types/node --save-dev`, {
      cwd: appFolder
    });
    writeFileSync(resolve(appFolder, ".gitignore"), gitignoreTemplate.ts());
  } else {
    writeFileSync(resolve(appFolder, ".gitignore"), gitignoreTemplate.js());
  }

  execSync(`npm install @miqro/test --save-dev`, {
    cwd: appFolder
  });

  execSync(
    `npx miqro new:main src_main`,
    {
      cwd: appFolder
    }
  );

  execSync(
    `npx miqro new:route src_api_health`,
    {
      cwd: appFolder
    }
  );

  mkdirSync(resolve(appFolder, "test"), {
    recursive: true
  });

  execSync(
    `npx miqro new:test test_api_health`,
    {
      cwd: appFolder
    }
  );

  console.log(`new project created on ${appFolder}`);

  console.log(`cd ${identifier}`);

  console.log(`npm run start`);
}

export const mainTS = (): void => mainJS(true);
