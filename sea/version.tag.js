import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from 'node:url';

export const __package_dirname = import.meta.url ? resolve(dirname(fileURLToPath(import.meta.url))) : null;

const version = JSON.parse(readFileSync(resolve(__package_dirname, "../package.json")).toString()).version;

console.log("writing [%s] with [%s]", resolve(__package_dirname, "version.tag"), version);

writeFileSync(resolve(__package_dirname, "version.tag"), version);
