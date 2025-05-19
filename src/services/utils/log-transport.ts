import { ConsoleTransport, FileTransport, LoggerTransport, LoggerTransportWriteArgs, LogLevel, WriteArgs } from "@miqro/core";
import { format } from "node:util";
import { LOG_SOCKET_PATH, LOG_WRITE_EVENT } from "../../../editor/common/constants.js";
import { Miqro } from "../app.js";

export function createLogProviderOptions(app: Miqro) {
  const defaultConsole = ConsoleTransport();
  //console.log("app.options.logFile [%s]", app.options.logFile);
  const defaultFile: LoggerTransport | undefined =
    app.options.logFile !== true && app.options.logFile !== false && String(app.options.logFile).toUpperCase() !== "TRUE" && String(app.options.logFile).toUpperCase() !== "FALSE" &&
      app.options.logFile ? FileTransport(app.options.logFile) :
      String(app.options.logFile).toUpperCase() === "TRUE" || app.options.logFile === true || app.options.logFile === undefined ?
        FileTransport() :
        undefined;
  const defaultWrite = async (args: LoggerTransportWriteArgs, level?: LogLevel) => {
    try {
      const serviceNamesWithLogConfigReplaceConsole = level === undefined && app.inflated ?
        Object.keys(app.inflated.logConfigMap).filter(serviceName => app.inflated.logConfigMap[serviceName].replaceConsoleTransport) : [];
      const serviceNamesWithLogConfigReplaceFile = level === undefined && app.inflated ?
        Object.keys(app.inflated.logConfigMap).filter(serviceName => app.inflated.logConfigMap[serviceName].replaceFileTransport) : [];
      await Promise.allSettled((level === undefined ?
        [
          level === undefined && serviceNamesWithLogConfigReplaceConsole.length === 0 && defaultConsole ?
            defaultConsole.write(args) : Promise.resolve(),
          level === undefined && serviceNamesWithLogConfigReplaceFile.length === 0 && defaultFile ?
            defaultFile.write(args) : Promise.resolve()
        ] : []).concat(app.inflated ?
          Object.keys(app.inflated.logConfigMap).map(serviceName => app.inflated.logConfigMap[serviceName]).filter(c => c.level === level).map(c => c.write(args)) : []
        ));
    } catch (e) {
      console.error(e);
    }
  }
  return {
    name: app.options.name,
    formatter: (args: WriteArgs) => {
      const params: string[] = args.optionalParams;
      return format(
        `${new Date().toISOString()} PID[${process.pid}] ${args.identifier ? `[${args.identifier}] ` : ""}${args.level !== "info" ? (args.level === "error" || args.level === "warn" ? `[${args.level.toUpperCase()}] ` : `[${args.level}] `) : ""}${args.message}`,
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
      })), {
        level: "trace" as LogLevel,
        write: async (args) => {
          try {
            if (app.options.editor) {
              try {
                const ws = app.webSocketManager.getWS(LOG_SOCKET_PATH);
                if (ws) {
                  //console.log("\n\n" + process.pid + " broadcasting " + LOG_SOCKET_PATH + "\n\n\n")
                  await ws.broadcast(JSON.stringify({
                    type: LOG_WRITE_EVENT,
                    level: args.level,
                    identifier: args.identifier,
                    out: args.out
                  }));
                }
              } catch (e) {
                console.error(e);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }],
    ...(app.options.logProviderOptions ? app.options.logProviderOptions : {})
  };
}
