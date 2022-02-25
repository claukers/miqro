import { loadConfig } from "@miqro/core";

export const usage = "usage: [NODE_ENV=development] npx miqro config:env";

export const main = (): void => {
  const logger = console;

  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args. ${usage}`);
  }

  const configOut = loadConfig();

  const config = configOut.combined;
  const keys = Object.keys(config);

  for (const key of keys) {
    logger.info(`${key}=${config[key]}`);
  }
}
