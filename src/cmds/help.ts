import { CMDS, usage } from "../cmd-map";
import { getUsage } from "../utils";

export function main() {
  console.log(getUsage(CMDS, usage));
}
