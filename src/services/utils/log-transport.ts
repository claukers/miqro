import { ConsoleTransport, FileTransport, LoggerTransport, LoggerTransportWriteArgs, LogLevel, WriteArgs } from "@miqro/core";
import { format } from "node:util";
import { LOG_SOCKET_PATH, LOG_WRITE_EVENT } from "../../../editor/common/constants.js";
import { Miqro } from "../app.js";
import { LogConfigMap } from "../../inflate/setup-log.js";
// import { WebSocketManager } from "./websocketmanager.js";
import { LogProviderOptions } from "./log.js";

export function createLogProviderOptions(app?: {
  options?: {
    dateTimeFormatOptions?: Intl.DateTimeFormatOptions;
    logProviderOptions?: LogProviderOptions;
    name?: string;
    editor?: boolean;
    logFile?: string | boolean;
  },
  inflated?: {
    logConfigMap: LogConfigMap;
  }
}) {
  const defaultConsole = ConsoleTransport();
  //console.log("app.options.logFile [%s]", app.options.logFile);
  const defaultFile: LoggerTransport | undefined =
    app && app.options && app?.options?.logFile !== true && app?.options?.logFile !== false && String(app?.options?.logFile).toUpperCase() !== "TRUE" && String(app?.options?.logFile).toUpperCase() !== "FALSE" &&
      app.options.logFile ? FileTransport(app.options.logFile) :
      app && app.options && String(app?.options?.logFile).toUpperCase() === "TRUE" || app?.options?.logFile === true || app?.options?.logFile === undefined ?
        FileTransport() :
        undefined;
  const defaultWrite = async (args: LoggerTransportWriteArgs, level?: LogLevel) => {
    try {
      // console.dir(app.inflated);
      const serviceNamesWithLogConfigReplaceConsole = app?.inflated ?
        Object.keys(app?.inflated?.logConfigMap).filter(serviceName => app?.inflated?.logConfigMap[serviceName].replaceConsoleTransport) : [];
      const serviceNamesWithLogConfigReplaceFile = app?.inflated ?
        Object.keys(app?.inflated?.logConfigMap).filter(serviceName => app?.inflated?.logConfigMap[serviceName].replaceFileTransport) : [];
      // console.dir(level);
      
      // console.dir(app?.inflated?.logConfigMap["m-admin"])
      // console.dir(serviceNamesWithLogConfigReplaceConsole.length);
      // console.dir(serviceNamesWithLogConfigReplaceFile.length);
      await Promise.allSettled((level === undefined ?
        [
          level === undefined && serviceNamesWithLogConfigReplaceConsole.length === 0 && defaultConsole ?
            defaultConsole.write(args) : Promise.resolve(),
          level === undefined && serviceNamesWithLogConfigReplaceFile.length === 0 && defaultFile ?
            defaultFile.write(args) : Promise.resolve()
        ] : []).concat(app && app.inflated && app?.inflated ?
          Object.keys(app?.inflated?.logConfigMap).map(serviceName => app?.inflated?.logConfigMap[serviceName]).filter(c => c.level === level).map(c => c.write(args)) : []
        ));
    } catch (e) {
      console.error(e);
    }
  }
  return {
    name: app?.options?.name,
    formatter: (args: WriteArgs) => {
      const params: string[] = args.optionalParams;
      return format(
        `${new Date().toLocaleDateString(undefined, app?.options?.dateTimeFormatOptions ? app?.options?.dateTimeFormatOptions : {
          hour12: false
        })} ${new Date().toLocaleTimeString(undefined, app?.options?.dateTimeFormatOptions ? app?.options?.dateTimeFormatOptions : {
          hour12: false
        })} PID[${process.pid}] ${args.identifier ? `[${args.identifier}] ` : ""}${args.level !== "info" ? (args.level === "error" || args.level === "warn" ? `[${args.level.toUpperCase()}] ` : `[${args.level}] `) : ""}${args.message}`,
        ...params)
    },
    transports: [
      ...(([undefined, "error", "warn", "info", "debug", "trace"] as LogLevel[]).map(level => {
        return level ? {
          level,
          write: async (args) => {
            await defaultWrite(args, level);
          }
        } : {
          write: async (args) => {
            await defaultWrite(args, undefined);
          }
        }
      }))],
    ...(app?.options?.logProviderOptions ? app?.options?.logProviderOptions : {})
  };
}
