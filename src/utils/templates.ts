// noinspection SpellCheckingInspection

export const testTemplates = {
  js: (category: string) =>
    `import { it } from "node:test";
import { TestHelper } from "@miqro/test-http";
import { Server, APIRouter } from "@miqro/core";
import { resolve } from "path";
import { strictEqual } from "assert";

it("happy path health", async () => {
  const response = await TestHelper(new Server().use(await APIRouter({
    dirname: resolve("./build/api")
  })), {
    url: "/health"
  });
  strictEqual(response.status, 200);
});
`
}

export const apiRouteTemplate = {
  ts: (noMethod = false) =>
    noMethod ? `import { APIRoute } from "@miqro/core";

export default {
  method: "GET",
  handler: async (req, res) => {
    return {
      text: \`Hello\`
    }
  }
} as APIRoute;
` : `import { APIRoute } from "@miqro/core";

export default {
  handler: async (req, res) => {
    return {
      text: \`Hello\`
    }
  }
} as APIRoute;
`,
  js: (noMethod = false) =>
    noMethod ? `module.exports = {
  method: "GET
  handler: async (req, res) => {
    return {
      text: \`Hello\`
    }
  }
};
` : `module.exports = {
  handler: async (req, res) => {
    return {
      text: \`Hello\`
    }
  }
};
`
}

export const mainTemplates = {
  ts: () =>
    `import { APIRouter, Server, checkEnvVariables, getLogger } from "@miqro/core";
import { resolve } from "path";

/*
To be start as a main file
node file.js
*/

const [PORT] = checkEnvVariables(["PORT"], ["8080"]);

const logger = getLogger("server");

async function main() {
  const server = new Server();
  server.use(await APIRouter({
    dirname: resolve("./build/api")
  }), "/api");
  await server.listen(PORT);
  server.logPaths(logger);
  logger.info("listening on " + PORT);
}

main().catch(e => logger.error(e));
`,
  js: () =>
    `const { APIRouter, App, checkEnvVariables, getLogger } = require("@miqro/core");
const { resolve } = require("path");

/*
To be start as a main file
node file.js
*/

const [PORT] = checkEnvVariables(["PORT"], ["8080"]);

const logger = getLogger("server");

async function main() {
  const server = new App();
  server.use(await APIRouter({
    dirname: resolve(__dirname, "api")
  }), "/api");
  await server.listen(PORT);
  server.logPaths(logger);
  logger.info("listening on " + PORT);
}

main().catch(e => logger.error(e));
`
}

export const gitignoreTemplate = {
  ts: () => `node_modules/
dist/
`,
  js: () => `node_modules/`
};

export const packageTemplate = {
  ts: (name: string) =>
    `{
  "name": "${name}",
  "type": "module",
  "version": "1.0.0",
  "description": "",
  "private": true,
  "scripts": {
    "prebuild": "rm -Rf build/;",
    "build": "tsc",
    "prestart": "npm run build",
    "start": "node --enable-source-maps build/main.js",
    "cluster": "NODE_OPTIONS=--enable-source-maps miqro cluster build/main.js",
    "pretest": "npm run build",
    "test": "node --enable-source-maps --test test/",
    "coverage": "node --enable-source-maps --experimental-test-coverage --test test/"
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": ""
}`,
  js: (name: string) =>
    `{
  "name": "${name}",
  "type": "module",
  "version": "1.0.0",
  "description": "",
  "private": true,
  "scripts": {
    "start": "node src/main.js",
    "cluster": "miqro cluster src/main.js",
    "test": "node --test test/",
    "coverage": "node --experimental-test-coverage --test test/"
  },
  "devDependencies": {
  },
  "dependencies": {
  },
  "author": ""
}`
}

export const logEnvFile = `####################
## logging
LOG_LEVEL=info
LOG_LEVEL_Database=error
#LOG_FILE=./logs/dev.log
`;

export const featuresEnvFile = `####################
## features
#MY_CUSTOM_FEATURE=false
`;

export const dbEnvFile = `####################
## db
DB_URI=sqlite://user:password@localhost:3306/devdb
DB_POOL=false
DB_DIALECT_SSL=true
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
DB_STORAGE=./dev.sqlite3
`;

export const authEnvFile = `####################
## Auth
TOKEN_LOCATION=header
#TOKEN_LOCATION=query
TOKEN_VERIFY_LOCATION=header
#TOKEN_VERIFY_LOCATION=query
TOKEN_HEADER=Authorization
#TOKEN_QUERY=Authorization
#TOKEN_VERIFY_ENDPOINT=
TOKEN_VERIFY_ENDPOINT_METHOD=GET
`;

// noinspection SpellCheckingInspection
const modelsIndex =
  `'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

const sequelizerc = require(path.resolve(__dirname, "..", "..", ".sequelizerc"));

const config = require(sequelizerc.config);
const modelsPath = sequelizerc['models-path'];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(modelsPath)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(modelsPath, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
module.exports.sequelize = sequelize;
module.exports.Sequelize = Sequelize;

`;
// noinspection SpellCheckingInspection
const dbConfig =
  `const { URL } = require("url");

const DB_URI = process.env.DB_URI;
const DB_POOL = process.env.DB_POOL ? process.env.DB_POOL : "false";
const DB_POOL_ACQUIRE = process.env.DB_POOL_ACQUIRE ? process.env.DB_POOL_ACQUIRE : "30000";
const DB_POOL_IDLE = process.env.DB_POOL_IDLE ? process.env.DB_POOL_IDLE : "10000";
const DB_POOL_MAX = process.env.DB_POOL_MAX ? process.env.DB_POOL_MAX : "5";
const DB_POOL_MIN = process.env.DB_POOL_MIN ? process.env.DB_POOL_MIN : "0";
const DB_DIALECT_SSL = process.env.DB_DIALECT_SSL === "true" || process.env.DB_DIALECT_SSL === undefined ? true : false;

const pool = DB_POOL === "true" ? {
  acquire: parseInt(DB_POOL_ACQUIRE, 10),
  idle: parseInt(DB_POOL_IDLE, 10),
  max: parseInt(DB_POOL_MAX, 10),
  min: parseInt(DB_POOL_MIN, 10)
} : undefined;

const parsed = new URL(process.env.DB_URI);

module.exports = {
  database: parsed.pathname.substr(1),
  host: parsed.hostname,
  port: parsed.port,
  username: parsed.username,
  password: parsed.password,
  dialect: parsed.protocol.substring(0, parsed.protocol.length - 1),
  dialectOptions: {
    ssl: DB_DIALECT_SSL
  },
  pool,
  storage: process.env.DB_STORAGE
};
`;
// noinspection SpellCheckingInspection
const sequelizerc = (typescript?: boolean): string =>
  `const path = require("path");

module.exports = {
  "config": path.resolve(__dirname, "db", "connection.js"),
  "migrations-path": path.resolve(__dirname, "db", "migrations"),
  "seeders-path": path.resolve(__dirname, "db", "seeders"),
  ${typescript ? `"models-path": path.resolve(__dirname, "dist", "models")` : `"models-path": path.resolve(__dirname, "db", "models")`},
};
`;

const exampleModel = (modelName: string): string => {
  return `module.exports = (sequelize, DataTypes) => {
  const ${modelName} = sequelize.define("${modelName}", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    surname: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING
  }, {});
  ${modelName}.associate = function(models) {
    // associations can be defined here
    // ${modelName}.belongsTo(models.....)
  };
  return ${modelName};
};`;
};

// noinspection SpellCheckingInspection
export const templates = {
  modelsIndex,
  dbConfig,
  sequelizerc,
  exampleModel,
  logEnvFile,
  authEnvFile,
  dbEnvFile,
  featuresEnvFile
};
