#!/usr/bin/env node
import { CMD_MAP, usage } from "./cmd-map.js";
import { mainCMD } from "./utils/index.js";

mainCMD(CMD_MAP, usage, console);
