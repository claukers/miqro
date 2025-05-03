import { resolve } from "node:path";
import { cwd } from "node:process";

export const PORT = process.env["PORT"] ? process.env["PORT"] : "8080";
export const BASE_PATH = resolve(cwd());
