import {App, loadConfig, LoggerHandler, Proxy, ReadBuffer, Static} from "@miqro/core";
import {extractFlags} from "../utils";
import {URL} from "url";
import {normalizePath} from "@miqro/core/dist/common/tokenize-match";

export const main = (): void => {
  const flags = extractFlags(process.argv.slice(3), {
    flags: {
      "proxy": {
        description: "proxy",
        hasValue: true
      },
      "port": {
        description: "port",
        hasValue: true
      }
    }
  });

  if (flags.files.length > 2) {
    throw new Error(`invalid number of args\nusage: [PORT=8080] npx miqro serve [directory=./] [path=/]`);
  }

  if (flags.flags.port instanceof Array) {
    throw new Error(`invalid number of args\nusage: [PORT=8080] npx miqro serve [directory=./] [path=/] [--port 8080] [--proxy /api=https://host/api]`);
  }

  let [directory, path] = flags.files;
  path = path ? path : "/";
  directory = directory ? directory : process.cwd();

  loadConfig();

  const PORT = flags.flags.port ? flags.flags.port : (process.env.PORT ? process.env.PORT : 8080);

  if (PORT === undefined) {
    throw new Error("port not defined");
  }

  const app = new App();
  app.use(LoggerHandler());

  const proxyList = flags.flags.proxy instanceof Array ? flags.flags.proxy : [flags.flags.proxy];
  for (const proxy of proxyList) {
    if (proxy) {
      const proxySplit = proxy.split("=");
      if (proxySplit.length !== 2) {
        throw new Error("proxy must be in the form. /path=proxy");
      }
      const proxyPath = normalizePath(proxySplit[0]);
      const proxyURL = new URL(proxySplit[1]);
      proxyURL.pathname = normalizePath(proxyURL.pathname);
      app.use(ReadBuffer());
      app.use(Proxy({
        url: proxyURL.toString()
      }), proxyPath);
    }
  }

  app.use(Static({
    directory,
    list: true
  }), path);
  app.listen(PORT, () => {
    console.log("serving " + directory + " on " + path + " on port " + PORT);
  });
}

