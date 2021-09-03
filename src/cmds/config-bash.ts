import { loadConfig } from "@miqro/core";

export const main = (): void => {
  const logger = console;

  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  const configOut = loadConfig();

  const config = configOut.combined;
  const keys = Object.keys(config);

  for (const key of keys) {
    logger.info(`export ${key}=${config[key]}`);
  }
}
