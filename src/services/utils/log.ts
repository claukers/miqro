import { ConsoleTransport, getEnvVariable, Logger, LoggerTransport, MinimalLogger, newURL, normalizePath, Request, WriteArgs } from "@miqro/core";
import { format } from "node:util";

const DEFAULT_ENV_NAME = "LOG_LEVEL";

export interface LogProviderOptions {
  name?: string;
  transports: LoggerTransport[];
  formatter: (args: WriteArgs) => string;
}

export const DEFAULT_FORMATTER = ({ identifier, level, message, optionalParams }: WriteArgs) => format(`${new Date().toISOString()} PID[${process.pid}] ` +
  `${identifier ? `[${identifier}] ` : ""}` +
  `${level !== "info" ? (level === "error" || level === "warn" ? `[${level.toUpperCase()}] ` : `[${level}] `) : ""}` +
  `${message}`, ...optionalParams)

export class LogProvider {

  public options: LogProviderOptions;
  public constructor(options?: LogProviderOptions) {
    this.options = {
      formatter: options && options.formatter ? options.formatter : DEFAULT_FORMATTER,
      transports: options && options.transports ? options.transports : [ConsoleTransport()],
      name: options?.name
    };
    this.requestLoggerFactory = this.requestLoggerFactory.bind(this);
  }

  public requestLoggerFactory(uuid: string, req: Request): MinimalLogger {
    let path = "";
    let query = "";
    let urlParsingError;
    let method = "GET";
    let remoteAddress: string | undefined = "";
    try {
      const url = newURL(req.url ? req.url : "/") as URL;
      query = url.searchParams.toString();
      path = normalizePath(url.pathname); // normalized path
      method = req.method ? req.method.toUpperCase() as string : "GET";
      remoteAddress = req.socket.remoteAddress;
    } catch (e) {
      urlParsingError = e;
    }
    const pathToEnv = path.replace(/\//ig, "_").replace(/\./ig, "_").replace(/-/ig, "_").toUpperCase();
    const WORKER_IDENTIFIER = process.env["CLUSTER_NODE_NUMBER"] ? `WORKER_${process.env["CLUSTER_NODE_NUMBER"]}_` : "";
    const identifier = `${pathToEnv === "_" ? "" : `${pathToEnv.substring(1)}`}${pathToEnv.charAt(pathToEnv.length - 1) !== "_" ? "_" : ""}${method.toUpperCase()}`;
    const upgrade = req.headers.connection?.indexOf("Upgrade") !== -1;

    const logger = this.getLogger(
      `${WORKER_IDENTIFIER}${identifier}`, {
      formatter: (args: WriteArgs) => {
        args.message = `%s${upgrade ? " UPGRADE" : ""} %s%s [%s] (%s) ${args.message}`;
        args.optionalParams = [method, path, query ? `?${query}` : "", uuid, remoteAddress].concat(args.optionalParams);
        args.meta.push(req);
        args.meta.push(uuid);
        return this.options.formatter(args);
      }
    });


    if (urlParsingError) {
      logger.error(urlParsingError);
    }

    return logger;
  };

  public getLogger(identifier: string, options?: { level?: any; transports?: any[]; formatter?: any; }): Logger {

    identifier = this.options.name ?
      `${this.options.name}${identifier ?
        `_${identifier}` : ""}`.toUpperCase() :
      identifier ? identifier.toUpperCase() : "";

    const envVarName = `LOG_LEVEL_${identifier}`;
    const level = options && options.level ? options.level : getEnvVariable(envVarName) ? getEnvVariable(envVarName) : getEnvVariable(DEFAULT_ENV_NAME, "info");

    const logger = new Logger(identifier, level, {
      transports: [],
      formatter: options && options.formatter ? options.formatter : this.options.formatter
    });
    for (const t of this.options.transports) {
      logger.addTransport(t);
    }
    if (options && options.transports) {
      for (const t of options.transports) {
        logger.addTransport(t);
      }
    }
    return logger;
  }
}
