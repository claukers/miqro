const modelsIndex =
`'use strict';

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const sequelizerc = require(path.resolve(__dirname, '..', '..', '.sequelizerc'));
const config = require(sequelizerc.config);

const modelsPath = __dirname;


const db = {
  sequelize: new Sequelize(config.database, config.username, config.password, config),
  Sequelize
};

fs
  .readdirSync(modelsPath)
  .filter((file) => {
    return (file !== "index.js") && (file.indexOf(".") !== 0) && (file.slice(-3) === ".js");
  })
  .forEach((file) => {
    const model = db.sequelize.import(path.join(modelsPath, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
module.exports = db;
`;
const dbConfig =
`["DB_NAME", "DB_USER", "DB_PASS", "DB_HOST", "DB_DIALECT",
"DB_OPERATORSALIASES", "DB_POOL_MAX", "DB_POOL_MIN", "DB_POOL_ACQUIRE", "DB_POOL_IDDLE", "DB_STORAGE"
].forEach((envName) => {
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
  operatorsAliases: process.env.DB_OPERATORSALIASES !== "false",
  pool: {
    acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10),
    idle: parseInt(process.env.DB_POOL_IDDLE, 10),
    max: parseInt(process.env.DB_POOL_MAX, 10),
    min: parseInt(process.env.DB_POOL_MIN, 10)
  },
  storage: process.env.DB_STORAGE
};
`;

const sequelizerc =
`const path = require("path");

module.exports = {
  "config": path.resolve(__dirname, "config", "db.js"),
  "migrations-path": path.resolve(__dirname, "db", "migrations"),
  "seeders-path": path.resolve(__dirname, "db", "seeders"),
  "models-path": path.resolve(__dirname, "db", "models"),
};
`;

const logjs =
`const path = require("path");
const winston = require("winston");
const {
  format
} = winston;
const {
  combine,
  label,
  printf,
  timestamp
} = format;

["LOG_FILE", "LOG_FILE_TRACE"].forEach((envName) => {
  if (process.env[envName] === undefined) {
    throw new Error(\`Env variable [\${envName}!] not defined\`);
  }
});

const logFormat = printf((info) => {
  const pid = process.pid;
  const envString = pid;
  const component = info.label;
  const level = info.level;
  const text = info.message;
  const ret = \`\${new Date(info.timestamp).getTime()} \${envString} \` +
    \`[\${component}] \` +
    \`\${level !== "info" ? (level === "error" || level === "warn" ? \`[\${level.toUpperCase()}] \` : \`[\${level}] \`) : ""}\` +
    \`\${text}\`;
  return ret;
});

module.exports = (identifier) => {
  const level = process.env[\`LOG_LEVEL_\${identifier}\`] || process.env.LOG_LEVEL;
  return {
    format: combine(
      label({
        label: identifier
      }),
      timestamp(),
      logFormat
    ),
    transports: [
      new winston.transports.Console({
        level
      }),
      new winston.transports.File({
        level,
        filename: path.resolve(process.env.LOG_FILE)
      }),
      new winston.transports.File({
        level: "silly",
        filename: path.resolve(process.env.LOG_FILE_TRACE)
      })
    ]

  };
};
`;

export const defaultEnvFile = `# db
DB_NAME=db
DB_HOST=localhost
# should be loadad from a secret manager into process.env.DB_USER
DB_USER=
# should be loadad from a secret manager into process.env.DB_PASS
DB_PASS=
DB_DIALECT=sqlite
DB_OPERATORSALIASES=false
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDDLE=10000
DB_STORAGE=./db.sqlite3
DB_DROPTABLES=false
# logging
LOG_LEVEL="info"
LOG_LEVEL_Sequelize="error"
# htto server
PORT=8080
# jsonwebtoken
JWT_HEADER=X-TOKEN
# should be loadad from a secret manager into process.env.JWT_SECRET
JWT_SECRET=
JWT_EXPIRATION=3d
# body-parser
BODYPARSER_INFLATE=true
BODYPARSER_LIMIT="100kb"
BODYPARSER_STRICT=true
BODYPARSER_TYPE="100kb"
`;

export const templates = {
  defaultEnvFile,
  modelsIndex,
  dbConfig,
  sequelizerc,
  logjs
};
