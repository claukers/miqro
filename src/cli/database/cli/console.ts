import { Util } from "@miqro/core";
import { createInterface } from "readline";
import { Database } from "@miqro/database";

export const main = (): void => {
  if (process.argv.length !== 3) {
    throw new Error(`invalid number of args`);
  }

  Util.loadConfig();
  const logger = Util.getLogger("db:console");
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const db = Database.getInstance();
  db.on("error", (e) => {
    logger.error(e);
  });
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
