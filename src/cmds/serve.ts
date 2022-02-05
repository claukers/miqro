import {App, loadConfig, Static, LoggerHandler} from "@miqro/core";

export const main = (): void => {

  if (process.argv.length <= 3 || process.argv.length > 5) {
    throw new Error(`invalid number of args\nusage: [PORT=8080] npx miqro serve <directory> [path=/]`);
  }

  const directory = process.argv[3];
  const path = process.argv[4] ? process.argv[4] : "/";

  loadConfig();

  const PORT = process.env.PORT ? process.env.PORT : 8080;

  if (PORT === undefined) {
    throw new Error("PORT env var not defined");
  }

  const app = new App();
  app.use(LoggerHandler());
  app.use(Static({
    directory,
    list: true
  }), path);
  app.listen(PORT, () => {
    console.log("serving " + directory + " on " + path + " on port " + PORT);
  });
}

