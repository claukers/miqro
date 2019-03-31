"use strict";

import * as  express from "express";
import * as  path from "path";
import * as  fs from "fs";
import * as https from "https";
import * as http from "http";
import { setupMiddleware } from "../middleware";
import { Util } from "../util";

export const setupDB = () => {
  Util.checkEnvVariables(["MIQRO_DIRNAME"]);
  const sequelizerc = require(path.resolve(process.env.MIQRO_DIRNAME, ".sequelizerc"));
  return require(sequelizerc["models-path"]);
};

export const winstonConfig = () => {
  Util.checkEnvVariables(["MIQRO_DIRNAME"]);
  const logPath = path.resolve(process.env.MIQRO_DIRNAME, "config", "log.js");
  const logConfig = require(logPath);
  return logConfig;
};

export const setupInstance = (serviceName, scriptPath) => {
  Util.setupInstanceEnv(serviceName, scriptPath);
  Util.loadConfig();

  const logger = Util.getLogger(`${serviceName}`);

  logger.info(`config loaded from [${process.env.MIQRO_DIRNAME}]`);

  logger.info(`loading script from [${scriptPath}]!`);
  /* tslint:disable */
  const script = require(scriptPath);
  /* tslint:enable */
  return {
    script,
    logger
  };
};

export const runInstance = async (logger, script, scriptPath) => {
  Util.checkEnvVariables(["PORT", "HTTPS_ENABLE"]);
  return new Promise(async (resolve, reject) => {
    logger.info(`launching script`);
    const bApp = express();
    await setupMiddleware(bApp, logger);
    script(bApp).then((app) => {
      try {
        const errorHandler = (err) => {
          reject(err);
        };
        let server = null;
        if (process.env.HTTPS_ENABLE === "true") {
          logger.info(`HTTPS enabled`);
          Util.checkEnvVariables(["HTTPS_KEY", "HTTPS_CERT"]);
          const key = fs.readFileSync(path.resolve(process.env.HTTPS_KEY), 'utf8');
          const cert = fs.readFileSync(path.resolve(process.env.HTTPS_CERT), 'utf8');
          server = https.createServer({ key, cert }, app);
        } else {
          server = http.createServer(app);
        }
        server.once("error", errorHandler);
        server.listen(process.env.PORT, () => {
          logger.info(`script started on [${process.env.PORT}]`);
          server.removeListener("error", errorHandler);
          resolve({ app, server });
        });
      } catch (e) {
        reject(e);
      }
    }).catch((e) => {
      logger.error(e);
      logger.error(e.stack);
    });
  });
};
