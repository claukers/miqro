
import * as showdown from "showdown";
import { readFileSync } from "node:fs";
import { Logger } from "@miqro/core";

export function inflateMD2HTML(inFile: string, logger?: Logger): string {
  try {
    const converter = new (showdown as any).default.Converter();
    converter.setFlavor('github');
    /*converter.setOption("tables", true);
    converter.setOption("rawHeaderId", true);*/
    const text = readFileSync(inFile).toString();
    const html = converter.makeHtml(text);
    return html;
  } catch (e) {
    logger?.error("error with: " + inFile);
    logger?.error(e);
    throw e;
  }
}
