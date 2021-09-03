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
DB_NAME=devdb
DB_HOST=localhost
DB_PORT=3306
# should be loadad from a secret manager into process.env.DB_USER
DB_USER=
# should be loadad from a secret manager into process.env.DB_PASS
DB_PASS=
DB_DIALECT=sqlite
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
  `const { loadConfig } = require("@miqro/core");

loadConfig();

["DB_DIALECT_SSL", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASS", "DB_HOST", ` +
  `"DB_DIALECT", "DB_POOL_MAX", "DB_POOL_MIN", "DB_POOL_ACQUIRE", "DB_POOL_IDDLE", "DB_STORAGE"].forEach((envName) => {
if (process.env[envName] === undefined) {
  throw new Error(\`Env variable [\${envName}!] not defined\`);
}
});

module.exports = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  port: process.env.DB_PORT,
  dialectOptions: {
    ssl: process.env.DB_DIALECT_SSL === "true"
  },
  pool: {
    acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10),
    idle: parseInt(process.env.DB_POOL_IDDLE, 10),
    max: parseInt(process.env.DB_POOL_MAX, 10),
    min: parseInt(process.env.DB_POOL_MIN, 10)
  },
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
