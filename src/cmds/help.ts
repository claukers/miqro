import { CMD_MAP, usage } from "../cmd-map";
import { getUsage } from "../utils";

export function main() {
  console.log(getUsage(CMD_MAP, usage));
}
