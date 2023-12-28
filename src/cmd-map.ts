import { resolve } from "path";
import { existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { apiRouteTemplate, gitignoreTemplate, mainTemplates, packageTemplate, templates, testTemplates } from "./utils/templates.js";
import { App, ConfigPathResolver, LoggerHandler, Proxy, ReadBuffer, Static, loadConfig, normalizePath } from "@miqro/core";
import { getDOCJSON } from "./utils/doc/json.js";
import { getMDDoc } from "./utils/doc/md.js";
import { mainPath } from "@miqro/runner";
import { setupWatch } from "./utils/watch.js";
import { extractFlags, getUsage } from "./utils/exec.js";

export const usage = "npx miqro <command> [args]";

export const CMD_MAP = {

  ["new:api"]: {
    //section: "api development", 
    cb: (): void => {
      const usageTS = `usage: npx miqro new:api <identifier ex: NEW_APP>`;
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
        "module": "Node16",
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
    }, tabs: 4, description: `create a new project.`
  },

  ["new:api:main"]: {
    //section: "http scaffolding",
    cb: (): void => {

      if (process.argv.length !== 4 || process.argv[3].length < 1) {
        throw new Error(`usage: [NODE_ENV=development] npx miqro new:api:main <identifier ex: NEW_APP>`);
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
    },
    tabs: 3,
    description: `creates a new main file.`
  },
  ["new:api:route"]: {
    cb: (): void => {

      const nUsage = `usage: [NODE_ENV=development] npx miqro new:api:main <identifier ex: NEW_APP>`;
      if (process.argv.length !== 4 || process.argv[3].length < 1) {
        throw new Error(nUsage);
      }

      const identifier = process.argv[3].toLocaleLowerCase();

      const split = identifier.split("_").map(s => s.trim()).filter(s => s);

      const dots = split.filter(s => s.indexOf(".") !== -1);
      if (dots.length > 0) {
        throw new Error(`identifier cannot contain dots\n${nUsage}`);
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

      writeFileSync(filePath, apiRouteTemplate[ext](noMethod));
    }, tabs: 3, description: `creates a new route.`
  },
  ["new:api:route:test"]: {
    cb: (): void => {

      if (process.argv.length !== 4 || process.argv[3].length < 1) {
        throw new Error(`usage: [NODE_ENV=development] npx miqro new:test <identifier ex: TEST_SOMEFILE>`);
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
    }, tabs: 2, description: `create new test.js file for an APIRouter.`
  },

  ["config"]: {
    //section: "config management",
    cb: (): void => {
      const logger = console;

      if (process.argv.length !== 3) {
        throw new Error(`invalid number of args. ${"usage: [NODE_ENV=development] npx miqro config"}`);
      }

      const configOut = loadConfig();

      const config = configOut.combined;

      logger.info(JSON.stringify(config, undefined, 2));
    },
    tabs: 4,
    description: `print config as a json.`
  },
  ["config:bash"]: {
    cb: (): void => {
      const logger = console;

      if (process.argv.length !== 3) {
        throw new Error(`invalid number of args. usage: [NODE_ENV=development] npx miqro config:bash`);
      }

      const configOut = loadConfig();

      const config = configOut.combined;
      const keys = Object.keys(config);

      for (const key of keys) {
        logger.info(`export ${key}=${config[key]}`);
      }
    },
    tabs: 3,
    description: `print config as a bash script.`
  },
  ["config:env"]: {
    cb: (): void => {
      const logger = console;

      if (process.argv.length !== 3) {
        throw new Error(`invalid number of args. usage: [NODE_ENV=development] npx miqro config:env`);
      }

      const configOut = loadConfig();

      const config = configOut.combined;
      const keys = Object.keys(config);

      for (const key of keys) {
        logger.info(`${key}=${config[key]}`);
      }
    },
    tabs: 3,
    description: `print config as a env file.`
  },
  ["config:init"]: {
    cb: (): void => {
      const logger = console;

      if (process.argv.length !== 3) {
        throw new Error(`invalid number of args. usage: [NODE_ENV=development] npx miqro config:init`);
      }

      loadConfig();

      const configPath = ConfigPathResolver.getConfigDirname();

      const initEnvFile = (path: string, template: string): void => {
        if (!existsSync(path)) {
          logger.warn(`creating ${path} env file`);
          writeFileSync(path, template);
        } else {
          logger.warn(`${path} already exists!. init will not create it.`);
        }
      };

      if (!existsSync(configPath)) {
        logger.warn(`[${configPath}] doesnt exists!`);
        mkdirSync(configPath, {
          recursive: true
        });
      }
      initEnvFile(resolve(configPath, `log.env`), templates.logEnvFile);
      initEnvFile(resolve(configPath, `auth.env`), templates.authEnvFile);
      initEnvFile(resolve(configPath, `features.env`), templates.featuresEnvFile);
    }, tabs: 3, description: `inits your config folder.`
  },

  ["doc"]: {
    //section: "api documentation",
    tabs: 4,
    cb: async (): Promise<void> => {

      if (process.argv.length < 5 || process.argv.length > 6) {
        throw new Error(`usage: [NODE_ENV=development] npx miqro doc <api_folder> <subPath> [apiName]`);
      }

      const dirname = process.argv[3];
      const subPath = process.argv[4];
      const apiName = process.argv[5];

      loadConfig();

      console.log(JSON.stringify(await getDOCJSON({ dirname, subPath, apiName }), undefined, 2));
    },
    description: `api folder auto doc as a json.`
  },
  ["doc:md"]: {
    cb: async (): Promise<void> => {

      if (process.argv.length < 5 || process.argv.length > 6) {
        throw new Error(`usage: [NODE_ENV=development] npx miqro doc <api_folder> <subPath> [apiName]`);
      }

      const dirname = process.argv[3];
      const subPath = process.argv[4];
      const apiName = process.argv[5];

      loadConfig();

      console.log(await getMDDoc({ dirname, subPath, apiName }));
    },
    tabs: 4,
    description: `api folder auto doc as a markdown.`
  },

  ["start"]: {
    //section: "start helpers",
    tabs: 4,
    cb: start,
    description: `start script in cluster mode.`
  },

  ["cluster"]: {
    tabs: 4,
    cb: start,
    description: `alias for start command.`
  },

  ["watch"]: {
    //section: "watch",
    cb: (): void => {

      const usageMessage = (message?: string) => `${message ? `${message}.\n` : ""}usage: npx miqro watch <directory> <cmd>`;

      if (process.argv.length < 5) {
        throw new Error(usageMessage("invalid number of args"));
      }

      const directory = process.argv[3];
      const cmd = process.argv.slice(4).join(" ");
      const timeout = process.env.WATCH_TIMEOUT ? parseInt(process.env.WATCH_TIMEOUT, 10) : undefined;

      if (!existsSync(directory) || !statSync(directory).isDirectory()) {
        throw new Error(usageMessage("directory not found!"));
      }

      console.log(`setting up watch on ${directory} with cmd ${cmd}`);
      setupWatch(directory, cmd, timeout);
    },
    tabs: 4,
    description: `watch folder for changes.`
  },

  ["serve"]: {
    //section: "serve static files",
    tabs: 4,
    cb: async (): Promise<void> => {
      const nUsage = `usage: [NODE_ENV=development] npx miqro serve [directory=./] [path=/] [--index404 ./index.html] [--proxy-cert-ignore] [--port 8080] [--proxy /api=https://host/api]`;
      const flags = extractFlags(process.argv.slice(3), {
        flags: {
          "help": {
            description: "get help page", hasValue: false
          },
          "index404Status": {
            description: "status to handle index404 status", hasValue: true
          },
          "index404": {
            description: "file to handle 404", hasValue: true
          }, "proxy": {
            description: "proxy", hasValue: true
          }, "proxy-cert-ignore": {
            description: "proxy ignore certs", hasValue: false
          }, "port": {
            description: "port", hasValue: true
          }
        }
      });

      if (flags.flags.help !== undefined) {
        console.log(nUsage);
        process.exit(102);
      }

      if (flags.files.length > 2) {
        throw new Error(`invalid arguments.\n${nUsage}`);
      }

      if (flags.flags.index404 instanceof Array) {
        throw new Error(`invalid index404!.\n${nUsage}`);
      }

      if (flags.flags.port instanceof Array) {
        throw new Error(`invalid port!.\n${nUsage}`);
      }

      let [directory, path] = flags.files;
      path = path ? path : "/";
      directory = directory ? directory : process.cwd();

      loadConfig();

      const PORT = flags.flags.port ? flags.flags.port : (process.env.PORT ? process.env.PORT : 8080);

      if (PORT === undefined) {
        throw new Error(`invalid port!.\n${nUsage}`);
      }

      if (!existsSync(directory) || !statSync(directory).isDirectory()) {
        throw new Error(`${directory} directory not found!\n${nUsage}`);
      }

      const app = new App();
      app.use(LoggerHandler());

      const proxyList = flags.flags.proxy instanceof Array ? flags.flags.proxy : [flags.flags.proxy];
      for (const proxy of proxyList) {
        if (proxy) {
          const proxySplit = proxy.split("=");
          if (proxySplit.length !== 2) {
            throw new Error("proxy must be in the form. /path=proxy");
          }
          const proxyPath = normalizePath(proxySplit[0]);
          const proxyURL = new URL(proxySplit[1]);
          proxyURL.pathname = normalizePath(proxyURL.pathname);
          const proxyRouter = Proxy({
            url: proxyURL.toString(), rejectUnauthorized: flags.flags["proxy-cert-ignore"] ? true : false
          });
          console.log("setting up proxy to %s on %s", proxyURL.toString(), proxyPath);
          proxyRouter.use(ReadBuffer());
          app.use(proxyRouter, proxyPath);
        }
      }

      app.use(Static({
        directory,
        list: true,
        index404: flags.flags.index404 ? flags.flags.index404 as string : undefined,
        index404Status: flags.flags.index404Status ? parseInt(flags.flags.index404Status as string, 10) : undefined
      }), path);
      await app.listen(PORT);
      console.log("serving " + directory + " on http://localhost:%s%s", PORT, path);
    }, description: `serve static files.`
  },

  ["help"]: {
    //section: "help",
    cb: () => {
      console.log(getUsage(CMD_MAP, usage));
    },
    tabs: 4, description: "prints this page"
  }
}

function start(): void {

  if (process.argv.length <= 3) {
    throw new Error(`invalid number of args\nusage: CLUSTER_COUNT=os.cpus().length [CLUSTER_AUTO_BROADCAST=true|false] [CLUSTER_DISABLE_RESTART=true|false] npx miqro start <script> [...args]`);
  }

  loadConfig();

  execSync(`${process.argv[0]} ${mainPath()} ${process.argv.slice(3).join(" ")}`)
}
