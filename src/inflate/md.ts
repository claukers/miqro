
import { marked } from "marked";
import { readFileSync } from "node:fs";
import { Logger } from "@miqro/core";

export async function inflateMDString2HTML(text: string): Promise<string> {
  return marked.parse(text, {

  });
}
