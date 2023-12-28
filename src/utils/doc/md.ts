import { GroupPolicy, Logger, ParserMode, RouteJSONDoc, SchemaProperties } from "@miqro/core";
import { Schema } from "@miqro/parser";
import { getDOCJSON } from "./json.js";

/*interface SchemaProperties {
  [key: string]: Schema | string;
}

type ParserMode = "add_extra" | "no_extra" | "remove_extra"*/

export async function getMDDoc(args: { showFilePath?: boolean; apiName?: string; dirname: string; subPath: string; }, logger?: Logger) {

  const jsonDOC = await getDOCJSON(args, logger);

  const pathList = Object.keys(jsonDOC);

  let outMD = "";

  for (const path of pathList) {
    const pathData = jsonDOC[path];
    const methods = Object.keys(pathData);
    for (const method of methods) {
      const apiData: RouteJSONDoc = pathData[method];
      outMD += `## ${apiData.identifier}${args.showFilePath ? (apiData as any).___filePath : ""}\n\n`;
      if (apiData.name) {
        outMD += `${apiData.name}\n\n`;
      }
      if (apiData.description) {
        outMD += `${apiData.description}\n\n`;
      }
      outMD += `[${method}] ${path}\n\n`;
      if (apiData.policy) {
        outMD += `### policy\n\n`;
        outMD += policyToString(apiData.policy);
      }
      if (apiData.request) {
        const requestOutMD = parserToString(apiData.request);
        outMD += requestOutMD !== "" ? `### request\n\n${requestOutMD}` : "";
      }
      if (apiData.response && typeof apiData.response !== "boolean") {
        const responseOutMD = parserToString(apiData.response);
        outMD += responseOutMD !== "" ? `### response\n\n${responseOutMD}` : "";
      }
    }
  }
  return outMD;
}

function policyToString(policy: GroupPolicy): string {
  let outMD = "| groups | policy |\n";
  outMD += "|--------|--------|\n";
  outMD += `| ${(policy.groups instanceof Array ? policy.groups : [policy.groups]).join(",")} | ${policy.groupPolicy} |\n\n`;
  return outMD;
}

export function parserToString(parser: {
  headers?: string | SchemaProperties | SchemaProperties[];
  headersMode?: ParserMode;
  query?: string | SchemaProperties | boolean | SchemaProperties[];
  queryMode?: ParserMode;
  params?: string | SchemaProperties | boolean | SchemaProperties[];
  paramsMode?: ParserMode;
  body?: string | SchemaProperties | boolean | SchemaProperties[];
  bodyMode?: ParserMode;
}): string {
  let outMD = "";
  if (parser.params && typeof parser.params !== "boolean") {
    outMD += `#### path params\n\n`;
    outMD += parserPartToString(parser.params, parser.paramsMode);
  }
  if (parser.headers) {
    outMD += `#### headers\n\n`;
    outMD += parserPartToString(parser.headers, parser.headersMode);
  }
  if (parser.query && parser.query !== true) {
    outMD += `#### query\n\n`;
    outMD += parserPartToString(parser.query, parser.queryMode);
  }
  if (parser.body && parser.body !== true) {
    outMD += `#### body\n\n`;
    outMD += parserPartToString(parser.body, parser.bodyMode);
  }
  return outMD;
}

function parserPartToString(arg: string | SchemaProperties | false | SchemaProperties[], mode?: ParserMode): string {
  if (arg === false) {
    return "not allowed";
  }
  let outMD = "";
  let maxTabulation = 1;
  const parsers: Array<SchemaProperties | string> | string = arg instanceof Array ? arg : typeof arg === "string" ? [arg] : [arg];
  for (const parser of parsers) {
    const ret = internalParserToString(parser);
    if (ret.maxTabulation > maxTabulation) {
      maxTabulation = ret.maxTabulation;
    }
    outMD += `| name | type | description | ${getTabulation(ret.maxTabulation * 2)}\n`;
    outMD += `|--------|-------|-------|${getTabulation(ret.maxTabulation * 2, true)}\n`;
    outMD += `${ret.out}\n\n`;
  }
  return outMD
}

function internalParserToString(parser: string | SchemaProperties, tabulation = 1): { out: string, maxTabulation: number } {
  let outMD = "";
  let maxTabulation = tabulation;
  if (typeof parser === "string") {
    outMD += `${getTabulation(tabulation)}${parser}|\n`;
  } else {
    const attrNames = Object.keys(parser);
    for (const name of attrNames) {
      const p = parser[name];
      const description = typeof p === "string" ? "" : p.description ? p.description : "";
      if (typeof p === "string") {
        outMD += `${getTabulation(tabulation)}${name} | ${p}|\n`;
      } else if (p.type === "object") {
        outMD += `${getTabulation(tabulation)}${name} | ${p.type}| ${description}|\n`;
        const ret = parserBaseObjectTypeToString(p, tabulation + 1);
        if (maxTabulation < ret.maxTabulation) {
          maxTabulation = ret.maxTabulation;
        }
        outMD += `${ret.out}`;
      } else if (p.type === "dict") {
        outMD += `${getTabulation(tabulation)}${name} | Dict\\<${p.dictType}\\>| ${description}|\n`;
        if (p.dictType === "object") {
          const ret = parserBaseObjectTypeToString(p, tabulation + 1);
          if (maxTabulation < ret.maxTabulation) {
            maxTabulation = ret.maxTabulation;
          }
          outMD += `${ret.out}`;
        }
      } else if (p.type === "array") {
        outMD += `${getTabulation(tabulation)}${name} | Array\\<${p.arrayType}\\>| ${description}|\n`;
        if (p.arrayType === "object") {
          const ret = parserBaseObjectTypeToString(p, tabulation + 1);
          if (maxTabulation < ret.maxTabulation) {
            maxTabulation = ret.maxTabulation;
          }
          outMD += `${ret.out}`;
        }
      } else if (p.type === "regex") {
        outMD += `${getTabulation(tabulation)}${name} | ${p.regex}| ${description}|\n`;
      } else if (p.type === "enum") {
        outMD += `${getTabulation(tabulation)}${name} | ${p.type}| ${description}|\n`;
        outMD += `${getTabulation(tabulation + 1)}| ${p.enumValues?.join(",")}|\n`;
        if (maxTabulation < tabulation + 1) {
          maxTabulation = tabulation + 1;
        }
      } else {
        outMD += `${getTabulation(tabulation)}${name} | ${p.type}| ${description}|\n`;
      }
    }
  }
  return {
    out: outMD,
    maxTabulation
  };
}

function parserBaseObjectTypeToString(arg: Schema, tabulation: number): { out: string; maxTabulation: number } {
  const options: SchemaProperties = arg.properties ? arg.properties : {};
  //const outMD = `${getTabulation(tabulation)}name | type |\n${getTabulation(tabulation)}--------|--------|\n`;
  return internalParserToString(options, tabulation + 1);
}

function getTabulation(n: number, header = false) {
  let out = "";
  for (let i = 0; i < n; i++) {
    out += header ? "-|" : "| ";
  }
  return out;
}
