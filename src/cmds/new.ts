import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "../utils/index.js";

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
  "type": "module",
  "version": "1.0.0",
  "description": "",
  "private": true,
  "scripts": {
    "prebuild": "rm -Rf build/;",
    "build": "tsc",
    "prestart": "npm run build",
    "start": "node --enable-source-maps build/main.js",
    "cluster": "NODE_OPTIONS=--enable-source-maps miqro cluster build/main.js",
    "pretest": "npm run build",
    "test": "node --enable-source-maps --test test/",
    "coverage": "node --enable-source-maps --experimental-test-coverage --test test/"
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": ""
}`,
  js: (name: string) =>
    `{
  "name": "${name}",
  "type": "module",
  "version": "1.0.0",
  "description": "",
  "private": true,
  "scripts": {
    "start": "node src/main.js",
    "cluster": "miqro cluster src/main.js",
    "test": "node --test test/",
    "coverage": "node --experimental-test-coverage --test test/"
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": ""
}`
}

export const usageTS = `usage: npx miqro new:api <identifier ex: NEW_APP>`;

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

  execSync(
    `npm install @miqro/core --save`,
    {
      cwd: appFolder
    }
  );


  writeFileSync(resolve(appFolder, "tsconfig.json"), `{
  "compileOnSave": true,
  "compilerOptions": {
    "lib": ["es2021"],
    "module": "es2022",
    "moduleResolution": "Node16",
    "target": "es2021",
    "strict": false,
    "outDir": "./build/",
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


  execSync(`npm install @miqro/test-http --save-dev`, {
    cwd: appFolder
  });

  execSync(
    `npx miqro new:api:main src_main`,
    {
      cwd: appFolder
    }
  );

  execSync(
    `npx miqro new:api:route src_api_health`,
    {
      cwd: appFolder
    }
  );

  mkdirSync(resolve(appFolder, "test"), {
    recursive: true
  });

  execSync(
    `npx miqro new:api:route:test test_api_health`,
    {
      cwd: appFolder
    }
  );

  console.log("");
  console.log("");

  console.log(`new project created on ${appFolder}`);

  console.log(`cd ${identifier}`);

  console.log(`npm run start`);
  
  console.log("");
}
