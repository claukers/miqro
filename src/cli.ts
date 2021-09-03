#!/usr/bin/env node
//@miqro/core
import { CLIUtil } from "@miqro/core";
import { main as start } from "./cmds/start";
import { mainJS as newJS } from "./cmds/new";
import { mainTS as newTS } from "./cmds/new";
import { mainMinimalTS as newMinimalTS } from "./cmds/new";
import { mainMinimalJS as newMinimalJS } from "./cmds/new";
import { main as apiDocJSON } from "./cmds/doc-json";
import { main as apiDocMD } from "./cmds/doc-md";
import { main as configInit } from "./cmds/config-init";
import { main as config } from "./cmds/config";
import { main as configBash } from "./cmds/config-bash";
import { main as configEnv } from "./cmds/config-env";
//@miqro/handlers
import { main as newRoute } from "./cmds/handler-apiroute-new";
import { main as newMain } from "./cmds/handler-main-new";
import { mainMinimal as newMainMinimal } from "./cmds/handler-main-new";
//@miqro/database
import { main as dbInit } from "./cmds/db-init";
import { main as makeMigrations } from "./cmds/db-makemigrations";
import { main as consoleCMD } from "./cmds/db-console";
import { main as createModel } from "./cmds/db-createmodel";
import { main as pushData } from "./cmds/db-push-data";
import { main as dumpData } from "./cmds/db-dump-data";

// noinspection SpellCheckingInspection
CLIUtil.cliFlow({
  ["new:main"]: { section: "http scafolding", cb: newMain, description: "\t\tcreates a new main file" },
  ["new:main:minimal"]: { cb: newMainMinimal, description: "\tcreates a new minimal main file" },
  ["new"]: { cb: newJS, description: "\t\t\tcreate a new project" },
  ["new:minimal"]: { cb: newMinimalJS, description: "\t\tcreate a new minimal project" },

  ["new:typescript"]: { cb: newTS, description: "\t\tcreate a new typescript project" },
  ["new:typescript:minimal"]: { cb: newMinimalTS, description: "\tcreate a new typescript minimal project" },
  ["new:route"]: { cb: newRoute, description: "\t\tcreates a new route" },

  ["config"]: { section: "config managment", cb: config, description: "\t\t\toutputs to stdout the config as a json" },
  ["config:bash"]: {
    cb: configBash,
    description: "\t\toutputs to stdout the config as a bash script"
  },
  ["config:env"]: { cb: configEnv, description: "\t\toutputs to stdout the config as a env file" },
  ["config:init"]: { cb: configInit, description: "\t\tinits your config folder" },

  ["start"]: { section: "cluster start", cb: start, description: "\t\t\tstart a nodejs script in cluster mode and restart if crash." },

  ["doc"]: { section: "api documentation", cb: apiDocJSON, description: "\t\t\toutputs to stdout an api folder auto doc as a json" },
  ["doc:md"]: { cb: apiDocMD, description: "\t\t\toutputs to a file an api folder auto doc as a markdown" },

  ["db:console"]: { section: "sequelize helpers", cb: consoleCMD, description: "\t\truns a readline interface that send the input as a query" },
  ["db:dump:data"]: { cb: dumpData, description: "\t\tdump the data of the database (only defined models)" },
  ["db:push:data"]: { cb: pushData, description: "\t\tpush a dump to the database" },
  ["db:make:migration"]: {
    cb: makeMigrations,
    description: "\tseeks changes in your models and creates migrations"
  },
  ["db:init"]: { cb: dbInit, description: "\t\t\tinit sequelize configuration." },
  ["db:create:model"]: { cb: createModel, description: "\t\tcreates an example model" }
}, "npx miqro <command> [args]", console);
