#!/usr/bin/env node
import {mainCMD} from "./utils";
import {main as start, usage as startUsage} from "./cmds/start";
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
import {main as generateTemplatesCache, usage as generateTemplatesCacheUsage} from "./cmds/wc-cache-templates";

// noinspection SpellCheckingInspection
mainCMD({

  ["new"]: {section: "quick start", cb: newJS, tabs: 5, description: `create a new project. ${newJSUsage}`},
  ["new:typescript"]: {cb: newTS, tabs: 4, description: `create a new typescript project. ${newTSUsage}`},

  ["new:main"]: {
    section: "http scafolding",
    cb: newMain,
    tabs: 4,
    description: `creates a new main file. ${newMainUsage}`
  },
  ["new:route"]: {cb: newRoute, tabs: 4, description: `creates a new route. ${newRouteUsage}`},

  ["config"]: {
    section: "config managment",
    cb: config,
    tabs: 5,
    description: `outputs to stdout the config as a json. ${configUsage}`
  },
  ["config:bash"]: {
    cb: configBash,
    tabs: 4,
    description: `outputs to stdout the config as a bash script. ${configBashUsage}`
  },
  ["config:env"]: {
    cb: configEnv,
    tabs: 4,
    description: `outputs to stdout the config as a env file. ${configEnvUsage}`
  },
  ["config:init"]: {cb: configInit, tabs: 4, description: `inits your config folder. ${configInitUsage}`},

  ["start"]: {
    section: "start helpers",
    tabs: 5,
    cb: start,
    description: `start a nodejs script in cluster mode and restart if crash. ${startUsage}`
  },

  ["watch"]: {
    //section: "watch",
    cb: watch,
    tabs: 5,
    description: `watch a folder for changes and runs a command if a change occours. ${watchUsage}`
  },

  ["serve"]: {
    //section: "serve static files",
    tabs: 6,
    cb: serve, description: `serve static files. ${serveUsage}`
  },

  /*["generate:html:cache"]: {
    section: "web components",
    tabs: 6,
    cb: generateTemplatesCache, description: `generate cache.js for webcomponents. ${generateTemplatesCacheUsage}`
  },*/

  ["doc"]: {
    section: "api documentation",
    tabs: 5,
    cb: apiDocJSON,
    description: `outputs to stdout an api folder auto doc as a json. ${apiDocJSONUsage}`
  },
  ["doc:md"]: {
    cb: apiDocMD,
    tabs: 5,
    description: `outputs to a file an api folder auto doc as a markdown. ${apiDocMDUsage}`
  },

  ["new:test"]: {section: "testing", cb: newTest, tabs: 4, description: `create new test.js file. ${newTestUsage}`},

  ["db:console"]: {
    section: "sequelize helpers",
    cb: consoleCMD,
    tabs: 4,
    description: `runs a readline interface that send the input as a query. ${consoleCMDUsage}`
  },
  ["db:dump:data"]: {
    cb: dumpData,
    tabs: 4,
    description: `dump the data of the database (only defined models). ${dumpDataUsage}`
  },
  ["db:push:data"]: {cb: pushData, tabs: 4, description: `push a dump to the database. ${pushDataUsage}`},
  ["db:make:migration"]: {
    cb: makeMigrations,
    tabs: 2,
    description: `seeks changes in your models and creates migrations. ${makeMigrationsUsage}`
  },
  ["db:make:migration:force:clean:state"]: {
    cb: syncMakeMigrations,
    tabs: 1,
    description: `regenerate _current.json in the migrations folder to force the 'local' migration state to be the same as the current models. ${syncMakeMigrationsUsage}`
  },
  ["db:migrate"]: {cb: migrate, tabs: 4, description: `loads config/<NODE_ENV>/*.env config and runs npx sequelize-cli db:migrate <...args>. ${migrateUsage}`},
  ["db:init"]: {cb: dbInit, tabs: 5, description: `init sequelize configuration. ${dbInitUsage}`},
  ["db:create:model"]: {cb: createModel, tabs: 4, description: `creates an example model. ${createModelUsage}`}
}, "npx miqro <command> [args]", console);
