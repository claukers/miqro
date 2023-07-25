#!/usr/bin/env node
import {mainCMD} from "./utils";
import {main as start} from "./cmds/start";
import {main as test} from "./cmds/test";
import {main as watch} from "./cmds/watch";
import {/*mainJS as newJS, */mainTS as newTS} from "./cmds/new";
import {main as apiDocJSON} from "./cmds/doc-json";
import {main as apiDocMD} from "./cmds/doc-md";
import {main as configInit} from "./cmds/config-init";
import {main as config} from "./cmds/config";
import {main as configBash} from "./cmds/config-bash";
import {main as configEnv} from "./cmds/config-env";
import {main as newRoute} from "./cmds/handler-apiroute-new";
import {main as newTest} from "./cmds/new-test";
import {main as serve} from "./cmds/serve";
import {main as newMain} from "./cmds/handler-main-new";
import {main as dbInit} from "./cmds/db-init";
import {main as makeMigrations} from "./cmds/db-makemigrations";
import {main as syncMakeMigrations} from "./cmds/db-sync-makemigrations";
import {main as consoleCMD} from "./cmds/db-console";
import {main as createModel} from "./cmds/db-createmodel";
import {main as pushData} from "./cmds/db-push-data";
import {main as dumpData} from "./cmds/db-dump-data";
import {main as migrate} from "./cmds/db-migrate";
import {mainTS as newTSFront} from "./cmds/wc-new";

// noinspection SpellCheckingInspection
mainCMD({

  ["new:api"]: {section: "api development", cb: newTS, tabs: 4, description: `create a new project.`},
  //["new:typescript"]: {cb: newTS, tabs: 4, description: `create a new typescript project.`},

  ["new:api:main"]: {
    //section: "http scafolding",
    cb: newMain,
    tabs: 3,
    description: `creates a new main file.`
  },
  ["new:api:route"]: {cb: newRoute, tabs: 3, description: `creates a new route.`},

  ["config"]: {
    //section: "config managment",
    cb: config,
    tabs: 4,
    description: `print config as a json.`
  },
  ["config:bash"]: {
    cb: configBash,
    tabs: 3,
    description: `print config as a bash script.`
  },
  ["config:env"]: {
    cb: configEnv,
    tabs: 3,
    description: `print config as a env file.`
  },
  ["config:init"]: {cb: configInit, tabs: 3, description: `inits your config folder.`},

  ["doc"]: {
    //section: "api documentation",
    tabs: 4,
    cb: apiDocJSON,
    description: `api folder auto doc as a json.`
  },
  ["doc:md"]: {
    cb: apiDocMD,
    tabs: 4,
    description: `api folder auto doc as a markdown.`
  },

  /*["new:front"]: {
    section: "front end development",
    cb: newTSFront,
    tabs: 3,
    description: `create a new web-components project.`
  },*/

  ["start"]: {
    section: "start helpers",
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
    cb: watch,
    tabs: 4,
    description: `watch folder for changes.`
  },
  
  ["serve"]: {
    //section: "serve static files",
    tabs: 4,
    cb: serve, description: `serve static files.`
  },

  ["test"]: {section: "testing", cb: test, tabs: 4, description: `run test files.`},

  ["new:test"]: {cb: newTest, tabs: 3, description: `create new test.js file.`},

  ["db:console"]: {
    section: "sequelize helpers",
    cb: consoleCMD,
    tabs: 3,
    description: `a query console for sequelize.`
  },
  ["db:dump:data"]: {
    cb: dumpData,
    tabs: 3,
    description: `dump the data of the database.`
  },
  ["db:push:data"]: {cb: pushData, tabs: 3, description: `push a dump to the database.`},
  ["db:make:migration"]: {
    cb: makeMigrations,
    tabs: 2,
    description: `generate migrations from model changes.`
  },
  ["db:migration:forceclean"]: {
    cb: syncMakeMigrations,
    tabs: 2,
    description: `force 'local' model state.`
  },
  ["db:migrate"]: {cb: migrate, tabs: 3, description: `loads config and run migrations.`},
  ["db:init"]: {cb: dbInit, tabs: 4, description: `init sequelize configuration.`},
  ["db:create:model"]: {cb: createModel, tabs: 3, description: `creates an example model.`}
}, "npx miqro <command> [args]", console);
