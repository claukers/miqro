import { readFileSync } from "node:fs";

console.log(Buffer.from(readFileSync(process.argv[2])).toString("base64"));
