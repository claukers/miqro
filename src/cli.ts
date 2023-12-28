#!/usr/bin/env node
import { CMD_MAP, usage } from "./cmd-map.js";
import { mainCMD } from "./utils/exec.js";

mainCMD(CMD_MAP, usage, console);
