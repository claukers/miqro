#!/usr/bin/env node
import { CMDS, usage } from "./cmd-map";
import { mainCMD } from "./utils";

mainCMD(CMDS, usage, console);
