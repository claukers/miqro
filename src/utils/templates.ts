// noinspection SpellCheckingInspection

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
DB_DIALECT_SSL=true
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDDLE=10000
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
  `const { loadConfig, checkEnvVariables } = require("@miqro/core");

loadConfig();

const { URL } = require("url");

const [DB_URI] = checkEnvVariables(["DB_URI"]);
const [DB_POOL, DB_POOL_ACQUIRE, DB_POOL_IDDLE, DB_POOL_MAX, DB_POOL_MIN] = checkEnvVariables(["DB_POOL", "DB_POOL_ACQUIRE", "DB_POOL_IDDLE", "DB_POOL_MAX", "DB_POOL_MIN"], ["false", "30000", "10000", "5", "0"]);

const pool = DB_POOL === "true" ? {
  acquire: parseInt(DB_POOL_ACQUIRE, 10),
  idle: parseInt(DB_POOL_IDDLE, 10),
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
    ssl: process.env.DB_DIALECT_SSL === "true" || process.env.DB_DIALECT_SSL === undefined ? true : false
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

const exampleModel = (modelName: string, typescript?: boolean): string => {
  return typescript ? `import { Sequelize, DataTypes, ModelCtor, Model } from "sequelize";
  
export interface ${modelName.charAt(0).toUpperCase()}${modelName.substring(1)} { 
  name: string; 
  timestamp: number; 
};
export type ${modelName.charAt(0).toUpperCase()}${modelName.substring(1)}Model = Model<${modelName.charAt(0).toUpperCase()}${modelName.substring(1)}>;
export type ${modelName.charAt(0).toUpperCase()}${modelName.substring(1)}ModelCtor = ModelCtor<${modelName.charAt(0).toUpperCase()}${modelName.substring(1)}Model>;

module.exports = (sequelize: Sequelize): ${modelName.charAt(0).toUpperCase()}${modelName.substring(1)}ModelCtor => {
  const ${modelName} = sequelize.define<${modelName.charAt(0).toUpperCase()}${modelName.substring(1)}Model>("${modelName}", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    timestamp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {});
  /* eslint-disable  @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  ${modelName}.associate = function (models) {
    // associations can be defined here
    // ${modelName}.belongsTo(models.....)
  };
  return ${modelName};
  };


  ` : `module.exports = (sequelize, DataTypes) => {
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
