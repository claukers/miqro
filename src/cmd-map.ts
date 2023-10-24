import { main as start } from "./cmds/start.js";
import { main as watch } from "./cmds/watch.js";
import { mainTS as newTS } from "./cmds/new.js";
import { main as apiDocJSON } from "./cmds/doc-json.js";
import { main as apiDocMD } from "./cmds/doc-md.js";
import { main as configInit } from "./cmds/config-init.js";
import { main as config } from "./cmds/config.js";
import { main as configBash } from "./cmds/config-bash.js";
import { main as configEnv } from "./cmds/config-env.js";
import { main as newRoute } from "./cmds/handler-apiroute-new.js";
import { main as newTest } from "./cmds/new-test.js";
import { main as serve } from "./cmds/serve.js";
import { main as help } from "./cmds/help.js";
import { main as newMain } from "./cmds/handler-main-new.js";

export const usage = "npx miqro <command> [args]";

export const CMD_MAP = {

  ["new:api"]: {
    //section: "api development", 
    cb: newTS, tabs: 4, description: `create a new project.`
  },
  //["new:typescript"]: {cb: newTS, tabs: 4, description: `create a new typescript project.`},

  ["new:api:main"]: {
    //section: "http scaffolding",
    cb: newMain,
    tabs: 3,
    description: `creates a new main file.`
  },
  ["new:api:route"]: { cb: newRoute, tabs: 3, description: `creates a new route.` },
  ["new:api:route:test"]: { cb: newTest, tabs: 2, description: `create new test.js file for an APIRouter.` },

  ["config"]: {
    //section: "config management",
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
  ["config:init"]: { cb: configInit, tabs: 3, description: `inits your config folder.` },

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
    cb: watch,
    tabs: 4,
    description: `watch folder for changes.`
  },

  ["serve"]: {
    //section: "serve static files",
    tabs: 4,
    cb: serve, description: `serve static files.`
  },

  ["help"]: {
    //section: "help",
    cb: help,
    tabs: 4, description: "prints this page"
  }
}
