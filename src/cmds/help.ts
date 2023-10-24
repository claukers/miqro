import { CMD_MAP, usage } from "../cmd-map.js";
import { getUsage } from "../utils/index.js";

export function main() {
  console.log(getUsage(CMD_MAP, usage));
}
