"use strict";

import * as  express from "express";
import * as  fs from "fs";
import * as http from "http";
import * as https from "https";
import * as  path from "path";
import { setupMiddleware } from "../middleware";
import { Util } from "../util";
import { Database } from "../db";

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
  Util.checkEnvVariables(["PORT", "HTTPS_ENABLE", "HTTPS_CA"]);
  return new Promise(async (resolve, reject) => {
    logger.info(`launching script`);
    await Database.getInstance().start();
    script(await setupMiddleware(express(), logger)).then((app) => {
      try {
        const errorHandler = (err) => {
          reject(err);
        };
        let server = null;
        if (process.env.HTTPS_ENABLE === "true") {
          logger.info(`HTTPS enabled`);
          Util.checkEnvVariables(["HTTPS_KEY", "HTTPS_CERT"]);
          const key = fs.readFileSync(path.resolve(process.env.HTTPS_KEY), "utf8");
          const cert = fs.readFileSync(path.resolve(process.env.HTTPS_CERT), "utf8");
          const ca = fs.readFileSync(path.resolve(process.env.HTTPS_CA), "utf8");
          server = https.createServer({ key, cert, ca }, app);
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
