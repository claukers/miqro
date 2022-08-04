#!/usr/bin/env node
import {mainCMD} from "./utils";
import {main as start, usage as startUsage} from "./cmds/start";
import {main as test, usage as testUsage} from "./cmds/test";
import {main as watch, usage as watchUsage} from "./cmds/watch";
import {mainJS as newJS, mainTS as newTS, usageJS as newJSUsage, usageTS as newTSUsage} from "./cmds/new";
import {main as apiDocJSON, usage as apiDocJSONUsage} from "./cmds/doc-json";
import {main as apiDocMD, usage as apiDocMDUsage} from "./cmds/doc-md";
import {main as configInit, usage as configInitUsage} from "./cmds/config-init";
import {main as config, usage as configUsage} from "./cmds/config";
import {main as configBash, usage as configBashUsage} from "./cmds/config-bash";
import {main as configEnv, usage as configEnvUsage} from "./cmds/config-env";
import {main as newRoute, usage as newRouteUsage} from "./cmds/handler-apiroute-new";
import {main as newTest, usage as newTestUsage} from "./cmds/new-test";
import {main as serve, usage as serveUsage} from "./cmds/serve";
import {main as newMain, usage as newMainUsage} from "./cmds/handler-main-new";
import {main as dbInit, usage as dbInitUsage} from "./cmds/db-init";
import {main as makeMigrations, usage as makeMigrationsUsage} from "./cmds/db-makemigrations";
import {main as syncMakeMigrations, usage as syncMakeMigrationsUsage} from "./cmds/db-sync-makemigrations";
import {main as consoleCMD, usage as consoleCMDUsage} from "./cmds/db-console";
import {main as createModel, usage as createModelUsage} from "./cmds/db-createmodel";
import {main as pushData, usage as pushDataUsage} from "./cmds/db-push-data";
import {main as dumpData, usage as dumpDataUsage} from "./cmds/db-dump-data";
import {main as migrate, usage as migrateUsage} from "./cmds/db-migrate";

// noinspection SpellCheckingInspection
mainCMD({

  ["new"]: {section: "api development", cb: newJS, tabs: 5, description: `create a new project.`},
  ["new:typescript"]: {cb: newTS, tabs: 4, description: `create a new typescript project.`},

  ["new:main"]: {
    //section: "http scafolding",
    cb: newMain,
    tabs: 4,
    description: `creates a new main file.`
  },
  ["new:route"]: {cb: newRoute, tabs: 4, description: `creates a new route.`},

  ["config"]: {
    //section: "config managment",
    cb: config,
    tabs: 5,
    description: `print config as a json.`
  },
  ["config:bash"]: {
    cb: configBash,
    tabs: 4,
    description: `print config as a bash script.`
  },
  ["config:env"]: {
    cb: configEnv,
    tabs: 4,
    description: `print config as a env file.`
  },
  ["config:init"]: {cb: configInit, tabs: 4, description: `inits your config folder.`},

  ["doc"]: {
    //section: "api documentation",
    tabs: 5,
    cb: apiDocJSON,
    description: `api folder auto doc as a json.`
  },
  ["doc:md"]: {
    cb: apiDocMD,
    tabs: 5,
    description: `api folder auto doc as a markdown.`
  },

  ["start"]: {
    section: "start helpers",
    tabs: 5,
    cb: start,
    description: `start script in cluster mode.`
  },

  ["watch"]: {
    //section: "watch",
    cb: watch,
    tabs: 5,
    description: `watch folder for changes.`
  },

  ["serve"]: {
    //section: "serve static files",
    tabs: 5,
    cb: serve, description: `serve static files.`
  },

  ["test"]: {section: "testing", cb: test, tabs: 5, description: `run test files.`},

  ["new:test"]: {cb: newTest, tabs: 4, description: `create new test.js file.`},

  ["db:console"]: {
    section: "sequelize helpers",
    cb: consoleCMD,
    tabs: 4,
    description: `a query console for sequelize.`
  },
  ["db:dump:data"]: {
    cb: dumpData,
    tabs: 4,
    description: `dump the data of the database.`
  },
  ["db:push:data"]: {cb: pushData, tabs: 4, description: `push a dump to the database.`},
  ["db:make:migration"]: {
    cb: makeMigrations,
    tabs: 3,
    description: `generate migrations from model changes.`
  },
  ["db:make:migration:force:clean:state"]: {
    cb: syncMakeMigrations,
    tabs: 1,
    description: `force 'local' model state.`
  },
  ["db:migrate"]: {cb: migrate, tabs: 4, description: `loads config and run migrations.`},
  ["db:init"]: {cb: dbInit, tabs: 5, description: `init sequelize configuration.`},
  ["db:create:model"]: {cb: createModel, tabs: 4, description: `creates an example model.`}
}, "npx miqro <command> [args]", console);
