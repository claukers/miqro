
import * as showdown from "showdown";
import { readFileSync } from "node:fs";
import { Logger } from "@miqro/core";

export function inflateMD2HTML(inFile: string, logger?: Logger): string {
  try {
    const text = readFileSync(inFile).toString();
    const html = inflateMDString2HTML(text);
    return html;
  } catch (e) {
    logger?.error("error with: " + inFile);
    logger?.error(e);
    throw e;
  }
}

export function inflateMDString2HTML(text: string, logger?: Logger): string {
  const converter = new (showdown as any).default.Converter();
  converter.setFlavor('github');
  /*converter.setOption("tables", true);
  converter.setOption("rawHeaderId", true);*/
  const html = converter.makeHtml(text);
  return html;
}
