#!/usr/bin/env node
//@miqro/core
import { CLIUtil } from "@miqro/core";
import { main as start } from "./core/cli/start";
import { mainJS as newJS } from "./core/cli/new";
import { mainTS as newTS } from "./core/cli/new";
import { mainMinimalTS as newMinimalTS } from "./core/cli/new";
import { mainMinimalJS as newMinimalJS } from "./core/cli/new";
import { main as apiDocJSON } from "./doc/cli/json";
import { main as apiDocMD } from "./doc/cli/md";
import { main as configInit } from "./core/cli/config-init";
import { main as config } from "./core/cli/config";
import { main as configBash } from "./core/cli/config-bash";
import { main as configEnv } from "./core/cli/config-env";
//@miqro/handlers
import { main as newRoute } from "./handlers/apiroute-new";
import { main as newMain } from "./handlers/main-new";
import { mainMinimal as newMainMinimal } from "./handlers/main-new";
//@miqro/database
import { main as dbInit } from "./database/cli/init";
import { main as makeMigrations } from "./database/cli/makemigrations";
import { main as migrate } from "./database/cli/migrate";
import { main as consoleCMD } from "./database/cli/console";
import { main as autoMigrate } from "./database/cli/automigrate";
import { main as seedAll } from "./database/cli/seed-all";
import { main as seed } from "./database/cli/seed";
import { main as undoSeedAll } from "./database/cli/undo-seed-all";
import { main as undoSeed } from "./database/cli/undo-seed";
import { main as migrationStatus } from "./database/cli/migration-status";
import { main as createModel } from "./database/cli/createmodel";
import { main as pushData } from "./database/cli/push-data";
import { main as dumpData } from "./database/cli/dump-data";

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
  ["db:automigrate"]: { cb: autoMigrate, description: "\t\truns makemigrations and migrate together" },
  ["db:makemigration"]: {
    cb: makeMigrations,
    description: "\tseeks changes in your models and creates migrations"
  },
  ["db:init"]: { cb: dbInit, description: "\t\t\tinit sequelize configuration." },
  ["db:create:model"]: { cb: createModel, description: "\t\tcreates an example model" },
  ["db:migrate:status"]: { section: "alias of sequelize-cli", cb: migrationStatus, description: "\talias for npx sequelize-cli db:migrate:status" },
  ["db:migrate"]: { cb: migrate, description: "\t\talias for npx sequelize-cli db:migrate" },
  ["db:seed:all"]: { cb: seedAll, description: "\t\talias for npx sequelize-cli db:seed:all" },
  ["db:seed"]: { cb: seed, description: "\t\t\talias for npx sequelize-cli db:seed" },
  ["db:seed:undo:all"]: { cb: undoSeedAll, description: "\talias for npx sequelize-cli db:seed:undo:all" },
  ["db:seed:undo"]: { cb: undoSeed, description: "\t\talias for npx sequelize-cli db:seed:undo\n" }
}, "npx miqro <command> [args]", console);
