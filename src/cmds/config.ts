import { loadConfig } from "@miqro/core";

export const usage = "usage: [NODE_ENV=development] npx miqro config";

export const main = (): void => {
  const logger = console;

  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args. ${usage}`);
  }

  const configOut = loadConfig();

  const config = configOut.combined;

  logger.info(JSON.stringify(config, undefined, 2));
}

