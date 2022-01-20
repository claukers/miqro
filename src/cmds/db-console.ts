import { loadConfig, getLogger } from "@miqro/core";
import { createInterface } from "readline";
import { loadSequelize } from "../utils/db";

export const main = (): void => {
  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  loadConfig();

  const logger = getLogger("db:console");
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const db = loadSequelize();
  const questionLoop = () => {
    rl.question('>', async (query) => {
      try {
        logger.info(`${query}`);
        const [result] = await db.query({
          query,
          values: []
        });
        logger.info(`${JSON.stringify(result, undefined, 4)}`);
        questionLoop();
      } catch (e) {
        logger.error(e);
        questionLoop();
      }
    });
  }
  questionLoop();
}
