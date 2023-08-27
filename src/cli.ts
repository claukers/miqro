#!/usr/bin/env node
import { CMD_MAP, usage } from "./cmd-map";
import { mainCMD } from "./utils";

mainCMD(CMD_MAP, usage, console);
