import {App, loadConfig, LoggerHandler, Proxy, ReadBuffer, Static} from "@miqro/core";
import {extractFlags} from "../utils";
import {URL} from "url";
import {normalizePath} from "@miqro/core/dist/common/tokenize-match";
import {existsSync, statSync} from "fs";

export const usage = `usage: [NODE_ENV=development] npx miqro serve [directory=./] [path=/] [--index404 ./index.html] [--proxy-cert-ignore] [--port 8080] [--proxy /api=https://host/api]`;

export const main = (): void => {
  console.log("asldkjdkla");
  const flags = extractFlags(process.argv.slice(3), {
    flags: {
      "index404Status": {
        description: "status to handle index404 status", hasValue: true
      },
      "index404": {
        description: "file to handle 404", hasValue: true
      }, "proxy": {
        description: "proxy", hasValue: true
      }, "proxy-cert-ignore": {
        description: "proxy ignore certs", hasValue: false
      }, "port": {
        description: "port", hasValue: true
      }
    }
  });

  if (flags.files.length > 2) {
    throw new Error(`invalid arguments.\n${usage}`);
  }

  if (flags.flags.index404 instanceof Array) {
    throw new Error(`invalid index404!.\n${usage}`);
  }

  if (flags.flags.port instanceof Array) {
    throw new Error(`invalid port!.\n${usage}`);
  }

  let [directory, path] = flags.files;
  path = path ? path : "/";
  directory = directory ? directory : process.cwd();

  loadConfig();

  const PORT = flags.flags.port ? flags.flags.port : (process.env.PORT ? process.env.PORT : 8080);

  if (PORT === undefined) {
    throw new Error(`invalid port!.\n${usage}`);
  }

  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    throw new Error(`${directory} directory not found!\n${usage}`);
  }

  const app = new App();
  app.use(LoggerHandler());

  console.log("asldkjdkla");

  console.dir(flags);

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
      const proxyRouter = Proxy({
        url: proxyURL.toString(), rejectUnauthorized: flags.flags["proxy-cert-ignore"] ? true : false
      });
      console.log("setting up proxy to %s on %s", proxyURL.toString(), proxyPath);
      proxyRouter.use(ReadBuffer());
      app.use(proxyRouter, proxyPath);
    }
  }

  app.use(Static({
    directory,
    list: true,
    index404: flags.flags.index404 ? flags.flags.index404 as string : undefined,
    index404Status: flags.flags.index404Status ? parseInt(flags.flags.index404Status as string, 10) : undefined
  }), path);
  app.listen(PORT, () => {
    console.log("serving " + directory + " on " + path + " on port " + PORT);
  });
}

