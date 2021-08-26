import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "../../utils";

const packageTemplate = {
  ts: (name: string) =>
    `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js"
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
    "start": "node src/main.js"
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": "",
  "license": "ISC"
}`
}

export const mainJS = (minimal = false, typescript = false): void => {
  if (process.argv.length !== 4 || process.argv[3].length < 1) {
    throw new Error(`arguments: <name ex: NEW_APP>`);
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
    "strict": false,
    "outDir": "./dist/",
    "removeComments": true,
    "noImplicitAny": false,
    "preserveConstEnums": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "declaration": true,
    "moduleResolution": "node",
    "module": "commonjs",
    "target": "es2017",
    "lib": [
      "es2017"
    ]
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
  }

  if (!minimal) {
    execSync(
      `npm install @miqro/handlers --save`,
      {
        cwd: appFolder
      }
    );
  }

  execSync(
    `npx miqro new:main${minimal ? ":minimal" : ""} src_main`,
    {
      cwd: appFolder
    }
  );

  if (!minimal) {
    execSync(
      `npx miqro new:route src_api_health`,
      {
        cwd: appFolder
      }
    );
  }
}

export const mainTS = (): void => mainJS(false, true);

export const mainMinimalJS = (): void => mainJS(true, false);

export const mainMinimalTS = (): void => mainJS(true, true);
