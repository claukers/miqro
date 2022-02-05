#!/usr/bin/env node
//@miqro/core
import { mainCMD } from "./utils";
import { main as start } from "./cmds/start";
import { mainJS as newJS } from "./cmds/new";
import { mainTS as newTS } from "./cmds/new";
import { main as apiDocJSON } from "./cmds/doc-json";
import { main as apiDocMD } from "./cmds/doc-md";
import { main as configInit } from "./cmds/config-init";
import { main as config } from "./cmds/config";
import { main as configBash } from "./cmds/config-bash";
import { main as configEnv } from "./cmds/config-env";
import { main as newRoute } from "./cmds/handler-apiroute-new";
import { main as newTest } from "./cmds/new-test";
import { main as serve } from "./cmds/serve";
import { main as newMain } from "./cmds/handler-main-new";
//@miqro/database
import { main as dbInit } from "./cmds/db-init";
import { main as makeMigrations } from "./cmds/db-makemigrations";
import { main as syncMakeMigrations } from "./cmds/db-sync-makemigrations";
import { main as consoleCMD } from "./cmds/db-console";
import { main as createModel } from "./cmds/db-createmodel";
import { main as pushData } from "./cmds/db-push-data";
import { main as dumpData } from "./cmds/db-dump-data";

// noinspection SpellCheckingInspection
mainCMD({

  ["new"]: { section: "quick start", cb: newJS, description: "\t\t\t\tcreate a new project" },
  ["new:typescript"]: { cb: newTS, description: "\t\t\tcreate a new typescript project" },

  ["new:main"]: { section: "http scafolding", cb: newMain, description: "\t\t\tcreates a new main file" },
  ["new:route"]: { cb: newRoute, description: "\t\t\tcreates a new route" },

  ["config"]: { section: "config managment", cb: config, description: "\t\t\t\toutputs to stdout the config as a json" },
  ["config:bash"]: {
    cb: configBash,
    description: "\t\t\toutputs to stdout the config as a bash script"
  },
  ["config:env"]: { cb: configEnv, description: "\t\t\toutputs to stdout the config as a env file" },
  ["config:init"]: { cb: configInit, description: "\t\t\tinits your config folder" },

  ["start"]: { section: "cluster start", cb: start, description: "\t\t\t\tstart a nodejs script in cluster mode and restart if crash." },

  ["serve"]: { section: "serve static files", cb: serve, description: "\t\t\t\tserve static files." },

  ["doc"]: { section: "api documentation", cb: apiDocJSON, description: "\t\t\t\toutputs to stdout an api folder auto doc as a json" },
  ["doc:md"]: { cb: apiDocMD, description: "\t\t\t\toutputs to a file an api folder auto doc as a markdown" },

  ["test:new"]: { section: "testing", cb: newTest, description: "\t\t\tcreate new test.js file." },

  ["db:console"]: { section: "sequelize helpers", cb: consoleCMD, description: "\t\t\truns a readline interface that send the input as a query" },
  ["db:dump:data"]: { cb: dumpData, description: "\t\t\tdump the data of the database (only defined models)" },
  ["db:push:data"]: { cb: pushData, description: "\t\t\tpush a dump to the database" },
  ["db:make:migration"]: {
    cb: makeMigrations,
    description: "\t\tseeks changes in your models and creates migrations"
  },
  ["db:make:migration:force:clean:state"]: {
    cb: syncMakeMigrations,
    description: "regenerate _current.json in the migrations folder to force the 'local' migration state to be the same as the current models."
  },
  ["db:init"]: { cb: dbInit, description: "\t\t\t\tinit sequelize configuration." },
  ["db:create:model"]: { cb: createModel, description: "\t\t\tcreates an example model" }
}, "npx miqro <command> [args]", console);
