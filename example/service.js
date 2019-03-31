const {
    Database,
    Util,
    APIResponse
  } = require("../dist");
  const path = require("path");
  
  module.exports = async (app) => {
    const logger = Util.getLogger(path.basename(__filename));
    const db = await Database.getInstance();
  
    app.get("/hello", async (req, res) => {
      logger.info("GET /hello called!");
      await new APIResponse({
        result: "world"
      }).send(res);
    });
    logger.info("started");
    return app;
  };
  