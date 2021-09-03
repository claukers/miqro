import fs from "fs";

import path from "path";
import { diff } from "deep-diff";

interface TableMap {
  [tableName: string]: {
    tableName: string;
    schema: any;
    indexes: any;
    model?: any;
    options?: any;
    fields?: any[];
  }
}

export interface MigrationState {
  tables: TableMap;
  revision: number;
}

/* tslint:disable */
const reverseSequelizeColType = (DataTypes: any, col: any, prefix = "Sequelize."): string => {
  const attrName = col.type.key;
  const attrObj = col.type;
  const options = (col.type.options) ? col.type.options : {};

  // noinspection SpellCheckingInspection,DuplicateCaseLabelJS
  switch (attrName) {
    // CHAR(length, binary)
    case DataTypes.CHAR.key:
      if (options.binary) {
        return prefix + "CHAR.BINARY";
      }
      return prefix + "CHAR(" + options.length + ")";

    // STRING(length, binary).BINARY
    case DataTypes.STRING.key:
      return prefix + "STRING" + ((options.length) ? "(" + options.length + ")" : "") +
        ((options.binary) ? ".BINARY" : "");

    // TEXT(length)
    case DataTypes.TEXT.key:
      if (!options.length) {
        return prefix + "TEXT";
      }
      return prefix + "TEXT(" + options.length.toLowerCase() + ")";

    // NUMBER(length, decimals).UNSIGNED.ZEROFILL
    case DataTypes.NUMBER.key:
    case DataTypes.TINYINT.key:
    case DataTypes.SMALLINT.key:
    case DataTypes.MEDIUMINT.key:
    case DataTypes.BIGINT.key:
    case DataTypes.FLOAT.key:
    case DataTypes.REAL.key:
    case DataTypes.DOUBLE.key:
    case DataTypes.DECIMAL.key:
    case DataTypes.INTEGER.key: {
      let ret = attrName;
      if (options.length) {
        ret += "(" + options.length;
        if (options.decimals) {
          ret += ", " + options.decimals;
        }
        ret += ")";
      }

      if (options.precision) {
        ret += "(" + options.precision;
        if (options.scale) {
          ret += ", " + options.scale;
        }
        ret += ")";
      }

      ret = [ret];

      if (options.zerofill) {
        ret.push("ZEROFILL");
      }

      if (options.unsigned) {
        ret.push("UNSIGNED");
      }

      return prefix + ret.join(".");
    }

    case DataTypes.ENUM.key:
      return prefix + "ENUM('" + options.values.join("', '") + "')";

    case DataTypes.BLOB.key:
      if (!options.length) {
        return prefix + "BLOB";
      }
      return prefix + "BLOB(" + options.length.toLowerCase() + ")";

    case DataTypes.GEOMETRY.key:
      if (options.type) {
        if (options.srid) {
          return prefix + "GEOMETRY('" + options.type + "', " + options.srid + ")";
        } else {
          return prefix + "GEOMETRY('" + options.type + "')";
        }
      }
      return prefix + "GEOMETRY";

    case DataTypes.GEOGRAPHY.key:
      return prefix + "GEOGRAPHY";

    case DataTypes.ARRAY.key:
      const _type = attrObj.toString();
      let arrayType;
      if (_type === "INTEGER[]" || _type === "STRING[]") {
        arrayType = prefix + _type.replace("[]", "");
      } else {
        arrayType = (col.seqType === "Sequelize.ARRAY(Sequelize.INTEGER)") ? prefix + "INTEGER" : prefix + "STRING";
      }
      return prefix + `ARRAY(${arrayType})`;

    case DataTypes.RANGE.key:
      console.warn(attrName + " type not supported, you should make it by");
      return prefix + attrObj.toSql();

    // BOOLEAN
    // TIME
    // DATE
    // DATEONLY
    // HSTORE
    // JSONB
    // UUID
    // UUIDV1
    // UUIDV4
    // VIRTUAL
    // INET
    // MACADDR
    default:
      return prefix + attrName;
  }
};

const reverseSequelizeDefValueType = (defaultValue: any, prefix = "Sequelize."): any => {
  if (typeof defaultValue === "object") {
    if (defaultValue.constructor && defaultValue.constructor.name) {
      return { internal: true, value: prefix + defaultValue.constructor.name };
    }
  }

  if (typeof defaultValue === "function") {
    return { notSupported: true, value: "" };
  }

  return { value: defaultValue };
};

const parseIndex = (idx: any): any => {
  delete idx.parser;
  if (idx.type == "") {
    delete idx.type;
  }

  const options: any = {};

  if (idx.name) {
    options.name = options.indexName = idx.name;
  } // The name of the index. Default is __

  // @todo: UNIQUE|FULLTEXT|SPATIAL
  if (idx.unique) {
    options.type = options.indicesType = "UNIQUE";
  }

  if (idx.method) {
    options.indexType = idx.type;
  } // Set a type for the index, e.g. BTREE. See the documentation of the used dialect

  if (idx.parser && idx.parser != "") {
    options.parser = idx.parser;
  } // For FULLTEXT columns set your parser

  idx.options = options;

  idx.hash = JSON.stringify(idx);

  //    log ('PI:', JSON.stringify(idx, null, 4));
  return idx;
};

/* eslint-disable  @typescript-eslint/explicit-module-boundary-types */
export const reverseModels = (sequelizeModule: any, sequelize: any, realModels: { [model: string]: any }, logger: any): TableMap => {

  const models: {
    [key: string]: {
      tableName: string;
      options: any;
      rawAttributes: { [attribute: string]: any };
    };
  } = {};
  for (const model in realModels) {
    if (model !== "default") {
      models[model] = {
        tableName: realModels[model].tableName,
        options: {
          ...realModels[model].options
        },
        rawAttributes: {
          ...realModels[model].rawAttributes
        }
      }
    }
  }
  const tables: TableMap = {};

  delete models.default;

  for (const model in models) {
    // noinspection JSUnfilteredForInLoop
    const attributes = models[model].rawAttributes;

    for (const column in attributes) {
      // noinspection JSUnfilteredForInLoop
      delete (attributes[column] as any).Model;
      // noinspection JSUnfilteredForInLoop
      delete (attributes[column] as any).fieldName;
      // delete attributes[column].field;

      // noinspection JSUnfilteredForInLoop
      for (const property in attributes[column]) {
        // noinspection JSUnfilteredForInLoop
        if (property.startsWith("_")) {
          // noinspection JSUnfilteredForInLoop
          delete attributes[column][property];
          continue;
        }

        if (property === "defaultValue") {
          // noinspection JSUnfilteredForInLoop
          const _val = reverseSequelizeDefValueType(attributes[column][property]);
          if (_val.notSupported) {
            // noinspection JSUnfilteredForInLoop
            logger.info(`[Not supported] Skip defaultValue column of attribute ${model}:${column}`);
            // noinspection JSUnfilteredForInLoop
            delete attributes[column][property];
            continue;
          }
          // noinspection JSUnfilteredForInLoop
          attributes[column][property] = _val;
        }

        // remove getters, setters...
        // noinspection JSUnfilteredForInLoop
        if (typeof attributes[column][property] == "function") {
          // noinspection JSUnfilteredForInLoop
          delete attributes[column][property];
        }
      }
      // noinspection JSUnfilteredForInLoop
      if (typeof attributes[column].type === "undefined") {
        // noinspection JSUnfilteredForInLoop
        if (!(attributes[column] as any).seqType) {
          // noinspection JSUnfilteredForInLoop
          logger.info(`[Not supported] Skip column with undefined type ${model}:${column}`);
          // noinspection JSUnfilteredForInLoop
          delete attributes[column];
          continue;
        } else {
          // noinspection JSUnfilteredForInLoop
          if (!["Sequelize.ARRAY(Sequelize.INTEGER)", "Sequelize.ARRAY(Sequelize.STRING)"].includes((attributes[column] as any).seqType)) {
            // noinspection JSUnfilteredForInLoop
            delete attributes[column];
            continue;
          }
          // noinspection JSUnfilteredForInLoop
          (attributes[column] as any).type = {
            key: sequelizeModule.ARRAY.key
          };
        }
      }
      // noinspection JSUnfilteredForInLoop
      let seqType = reverseSequelizeColType(sequelizeModule.DataTypes, attributes[column]);

      // NO virtual types in migration
      if (seqType === "Sequelize.VIRTUAL") {
        // noinspection JSUnfilteredForInLoop
        logger.info(`[SKIP] Skip Sequelize.VIRTUAL column "${column}"", defined in model "${model}"`);
        // noinspection JSUnfilteredForInLoop
        delete attributes[column];
        continue;
      }

      if (!seqType) {
        // noinspection JSUnfilteredForInLoop
        if (typeof (attributes[column] as any).type.options !== "undefined" && typeof (attributes[column] as any).type.options.toString === "function") {
          // noinspection JSUnfilteredForInLoop
          seqType = (attributes[column] as any).type.options.toString(sequelize);
        }
        // noinspection JSUnfilteredForInLoop
        if (typeof attributes[column].type.toString === "function") {
          // noinspection JSUnfilteredForInLoop
          seqType = attributes[column].type.toString(sequelize);
        }
      }
      // noinspection JSUnfilteredForInLoop
      (attributes[column] as any).seqType = seqType;
      // noinspection JSUnfilteredForInLoop
      delete attributes[column].type;
      // noinspection JSUnfilteredForInLoop
      delete attributes[column].values; // ENUM
    }
    // noinspection JSUnfilteredForInLoop
    (tables as any)[models[model].tableName] = {
      // noinspection JSUnfilteredForInLoop
      tableName: models[model].tableName,
      schema: attributes
    };
    // noinspection JSUnfilteredForInLoop
    if (models[model].options.indexes.length > 0) {
      const idxOut = {};
      // noinspection JSUnfilteredForInLoop
      for (const _i in models[model].options.indexes) {
        // noinspection JSUnfilteredForInLoop
        const index = parseIndex(models[model].options.indexes[_i]);
        (idxOut as any)[index.hash + ""] = index;
        delete index.hash;

        // make it immutable
        Object.freeze(index);
      }
      // noinspection JSUnfilteredForInLoop
      // models[model].options.indexes = idxOut;
      tables[models[model].tableName].indexes = idxOut;
    }
    // noinspection JSUnfilteredForInLoop
    if (typeof models[model].options.charset !== "undefined") {
      // noinspection JSUnfilteredForInLoop
      (tables as any)[models[model].tableName].charset = models[model].options.charset;
    }
    // noinspection JSUnfilteredForInLoop
    (tables as any)[models[model].tableName].indexes = models[model].options.indexes;
  }

  return tables;
};

interface DiffAction {
  actionType: string;
  columnName?: string;
  attributeName?: any;
  fields?: string[];
  tableName?: any;
  attributes?: any;
  options?: any;
  depends?: any;
}

export const parseDifference = (previousState: TableMap, currentState: TableMap, logger: any): DiffAction[] => {
  //    log(JSON.stringify(currentState, null, 4));
  const actions: DiffAction[] = [];
  const difference = diff(previousState, currentState);
  if (difference) {
    for (const df of difference) {
      //    log (JSON.stringify(df, null, 4));
      switch (df.kind) {
        // add new
        case "N": {
          // new table created
          if (df.path && df.path.length === 1) {
            const depends: any[] = [];
            const tableName = df.rhs.tableName;
            if (df.rhs.schema) {
              Object.keys(df.rhs.schema).forEach((v: any) => {
                if (v.references) {
                  depends.push(v.references.model);
                }
              });
            }

            const options: any = {};
            if (typeof df.rhs.charset !== "undefined") {
              options.charset = df.rhs.charset;
            }

            actions.push({
              actionType: "createTable",
              tableName,
              attributes: df.rhs.schema,
              options,
              depends
            });

            // create indexes
            if (df.rhs.indexes) {
              for (const _i in df.rhs.indexes) {
                // noinspection JSUnfilteredForInLoop
                actions.push({
                  ...{
                    actionType: "addIndex",
                    tableName,
                    depends: [tableName]
                  }, ...{ ...df.rhs.indexes[_i] }
                });
              }
            }
            break;
          }

          const tableName = df.path && df.path[0];
          const depends = [tableName];

          if (df.path && df.path[1] === "schema") {
            // if (df.path.length === 3) - new field
            if (df.path.length === 3) {
              // new field
              if (df.rhs && df.rhs.references) {
                depends.push(df.rhs.references.model);
              }

              actions.push({
                actionType: "addColumn",
                tableName,
                attributeName: df.path[2],
                options: df.rhs,
                depends
              });
              break;
            }

            // if (df.path.length > 3) - add new attribute to column (change col)
            if (df.path && df.path.length > 3) {
              if (df.path[1] === "schema") {
                // new field attributes
                const options = currentState[tableName].schema[df.path[2]];
                if (options.references) {
                  depends.push(options.references.nodel);
                }

                actions.push({
                  actionType: "changeColumn",
                  tableName,
                  attributeName: df.path[2],
                  options,
                  depends
                });
                break;
              }
            }
          }

          // new index
          if (df.path && df.path[1] === "indexes") {
            const tableName = df.path[0];
            const index: DiffAction = {
              ...df.rhs,
              actionType: "addIndex",
              tableName: tableName,
              depends: "addIndex",
            };

            index.depends = [tableName];
            actions.push(index);
            break;
          }
          break;
        }
        // drop
        case "D": {
          const tableName = df.path && df.path[0];
          const depends = [tableName];

          if (df.path && df.path.length === 1) {
            // drop table
            actions.push({
              actionType: "dropTable",
              tableName,
              depends: []
            });
            break;
          }

          if (df.path && df.path[1] === "schema") {
            // if (df.path.length === 3) - drop field
            if (df.path.length === 3) {
              // drop column
              actions.push({
                actionType: "removeColumn",
                tableName,
                columnName: df.path[2],
                depends: [tableName],
                options: df.lhs
              });
              break;
            }

            // if (df.path.length > 3) - drop attribute from column (change col)
            if (df.path.length > 3) {
              // new field attributes
              const options = currentState[tableName].schema[df.path[2]];
              if (options.references) {
                depends.push(options.references.nodel);
              }

              actions.push({
                actionType: "changeColumn",
                tableName,
                attributeName: df.path[2],
                options,
                depends
              });
              break;
            }
          }

          if (df.path && df.path[1] === "indexes") {
            //                    log(df)
            actions.push({
              actionType: "removeIndex",
              tableName,
              fields: df.lhs.fields as any,
              options: df.lhs.options,
              depends: [tableName]
            });
            break;
          }
          break;
        }
        // edit
        case "E": {
          const tableName = df.path && df.path[0];
          const depends = [tableName];

          if (df.path && df.path[1] === "schema") {
            // new field attributes
            const options = currentState[tableName].schema[df.path[2]];
            if (options.references) {
              depends.push(options.references.nodel);
            }

            actions.push({
              actionType: "changeColumn",
              tableName,
              attributeName: df.path[2],
              options,
              depends
            });
          }

          // updated index
          // only support updating and dropping indexes
          if (df.path && df.path[1] === "indexes") {
            const tableName = df.path && df.path[0];
            let keys = Object.keys(df.rhs);

            // noinspection LoopStatementThatDoesntLoopJS
            for (const k in keys) {
              const key = keys[k];
              // noinspection JSUnusedLocalSymbols
              actions.push({
                actionType: "addIndex",
                tableName,
                fields: df.rhs[key].fields,
                options: df.rhs[key].options,
                depends: [tableName]
              });
              break;
            }

            keys = Object.keys(df.lhs);
            // noinspection LoopStatementThatDoesntLoopJS
            for (const k in keys) {
              const key = keys[k];
              // noinspection JSUnusedLocalSymbols
              actions.push({
                actionType: "removeIndex",
                tableName,
                fields: df.lhs[key].fields,
                options: df.lhs[key].options,
                depends: [tableName]
              });
              break;
            }
          }
          break;
        }
        // array change indexes
        case "A": {
          logger.info("[Not supported] Array model changes! Problems are possible. Please, check result more carefully!");
          logger.info("[Not supported] Difference: ");
          logger.info(JSON.stringify(df, null, 4));
          break;
        }
        default:
          // code
          break;
      }
    }
  }
  return actions;
};

export const sortActions = (actions: DiffAction[]): void => {
  const orderedActionTypes = [
    "removeIndex",
    "removeColumn",
    "dropTable",
    "createTable",
    "addColumn",
    "changeColumn",
    "addIndex"
  ];

  // test
  // actions = shuffleArray(actions);

  actions.sort((a, b) => {
    if (orderedActionTypes.indexOf(a.actionType) < orderedActionTypes.indexOf(b.actionType)) {
      return -1;
    }
    if (orderedActionTypes.indexOf(a.actionType) > orderedActionTypes.indexOf(b.actionType)) {
      return 1;
    }

    if (a.depends.length === 0 && b.depends.length > 0) {
      return -1;
    } // a < b
    if (b.depends.length === 0 && a.depends.length > 0) {
      return 1;
    } // b < a

    return 0;
  });

  for (let k = 0; k <= actions.length; k++) {
    for (let i = 0; i < actions.length; i++) {
      if (!actions[i].depends) {
        continue;
      }
      if (actions[i].depends.length === 0) {
        continue;
      }

      const a = actions[i];

      for (let j = 0; j < actions.length; j++) {
        if (!actions[j].depends) {
          continue;
        }
        if (actions[j].depends.length === 0) {
          continue;
        }

        const b = actions[j];

        if (a.actionType != b.actionType) {
          continue;
        }

        if (b.depends.indexOf(a.tableName) !== -1 && i > j) {
          const c = actions[i];
          actions[i] = actions[j];
          actions[j] = c;
        }

      }
    }
  }
};

interface Migration {
  commandsUp: string[];
  consoleOut: string[];
}

// noinspection SpellCheckingInspection
export const getMigration = (actions: DiffAction[]): Migration => {
  const propertyToStr = (obj: any): any => {
    // noinspection SpellCheckingInspection
    const vals = [];
    for (const k in obj) {
      if (k === "seqType") {
        // noinspection JSUnfilteredForInLoop
        vals.push('"type": ' + obj[k]);
        continue;
      }

      if (k === "defaultValue") {
        // noinspection JSUnfilteredForInLoop
        if (obj[k].internal) {
          // noinspection JSUnfilteredForInLoop
          vals.push('"defaultValue": ' + obj[k].value);
          continue;
        }
        // noinspection JSUnfilteredForInLoop
        if (obj[k].notSupported) {
          continue;
        }

        const x = {};
        // noinspection JSUnfilteredForInLoop
        (x as any)[k] = obj[k].value;
        vals.push(JSON.stringify(x).slice(1, -1));
        continue;
      }

      const x = {};
      // noinspection JSUnfilteredForInLoop
      (x as any)[k] = obj[k];
      vals.push(JSON.stringify(x).slice(1, -1));
    }

    return "{ " + vals.reverse().join(", ") + " }";
  };

  const getAttributes = (attrs: any[]): any => {
    const ret = [];
    for (const attrName in attrs) {
      // noinspection JSUnfilteredForInLoop
      ret.push(`      "${attrName}": ${propertyToStr(attrs[attrName])}`);
    }
    return " { \n" + ret.join(", \n") + "\n     }";
  };

  const commandsUp = [];
  const consoleOut = [];

  for (const _i in actions) {
    // noinspection JSUnfilteredForInLoop
    const action = actions[_i];
    // noinspection FallThroughInSwitchStatementJS,FallThroughInSwitchStatementJS
    switch (action.actionType) {
      case "createTable": {
        const resUp = `{ fn: "createTable", params: [
    "${action.tableName}",
    ${getAttributes(action.attributes)},
    ${JSON.stringify(action.options)}
] }`;
        commandsUp.push(resUp);

        consoleOut.push(`createTable "${action.tableName}", deps: [${action.depends.join(", ")}]`);
      }
        break;

      case "dropTable": {
        const res = `{ fn: "dropTable", params: ["${action.tableName}"] }`;
        commandsUp.push(res);

        consoleOut.push(`dropTable "${action.tableName}"`);
      }
        break;

      case "addColumn": {
        const resUp = `{ fn: "addColumn", params: [
    "${action.tableName}",
    "${(action.options && action.options.field) ? action.options.field : action.attributeName}",
    ${propertyToStr(action.options)}
] }`;

        commandsUp.push(resUp);

        consoleOut.push(`addColumn "${action.attributeName}" to table "${action.tableName}"`);
      }
        break;

      case "removeColumn": {
        const res = `{ fn: "removeColumn", params: ["${action.tableName}", "${(action.options && action.options.field) ? action.options.field : action.columnName}"] }`;
        commandsUp.push(res);

        consoleOut.push(`removeColumn "${(action.options && action.options.field) ? action.options.field : action.columnName}" from table "${action.tableName}"`);
      }
        break;

      case "changeColumn": {
        const res = `{ fn: "changeColumn", params: [
    "${action.tableName}",
    "${(action.options && action.options.field) ? action.options.field : action.attributeName}",
    ${propertyToStr(action.options)}
] }`;
        commandsUp.push(res);

        consoleOut.push(`changeColumn "${action.attributeName}" on table "${action.tableName}"`);
      }
        break;

      case "addIndex": {
        const res = `{ fn: "addIndex", params: [
    "${action.tableName}",
    ${JSON.stringify(action.fields)},
    ${JSON.stringify(action.options)}
] }`;
        commandsUp.push(res);

        const nameOrAttrs = (action.options && action.options.indexName && action.options.indexName != "") ? `"${action.options.indexName}"` : JSON.stringify(action.fields);
        consoleOut.push(`addIndex ${nameOrAttrs} to table "${action.tableName}"`);
      }
        break;

      case "removeIndex": {
        //                log(action)
        const nameOrAttrs = (action.options && action.options.indexName && action.options.indexName != "") ? `"${action.options.indexName}"` : JSON.stringify(action.fields);

        const res = `{ fn: "removeIndex", params: [
    "${action.tableName}",
    ${nameOrAttrs}
] }`;
        commandsUp.push(res);

        consoleOut.push(`removeIndex ${nameOrAttrs} from table "${action.tableName}"`);
      }

      default:
      // code
    }
  }

  return { commandsUp, consoleOut };
};

interface WritenMigration {
  filename: string;
  info: {
    revision: number;
    name: string;
    created: Date;
    comment: string;
  }
};

export const writeMigration = (revision: number, migration: Migration, migrationsDir: string, name = "", comment = ""): WritenMigration => {
  const _commands = "var migrationCommands = [ \n" + migration.commandsUp.join(", \n") + " \n];\n";
  const _actions = " * " + migration.consoleOut.join("\n * ");

  //_commands = js_beautify(_commands);
  const info = {
    revision,
    name,
    created: new Date(),
    comment
  };

  const template = `'use strict';

const Sequelize = require('sequelize');

/**
 * Actions summary:
 *
${_actions}
 *
 **/

const info = ${JSON.stringify(info, null, 4)};

${_commands}

module.exports = {
    pos: 0,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
`;

  name = name.replace(" ", "_");
  const now = new Date();
  const timestamp = `${now.getFullYear()}${now.getMonth() + 1 < 10 ? "0" : ""}${now.getMonth() + 1}${now.getDate() < 10 ? "0" : ""}${now.getDate()}${now.getHours() < 10 ? "0" : ""}${now.getHours()}${now.getMinutes() < 10 ? "0" : ""}${now.getMinutes()}${now.getSeconds() < 10 ? "0" : ""}${now.getSeconds()}-${revision}`;
  const filename = path.join(migrationsDir, timestamp + ((name != "") ? `-${name}` : "") + ".js");

  fs.writeFileSync(filename, template);

  return { filename, info };
};
