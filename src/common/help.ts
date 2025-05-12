//import { basename } from "node:path";

export const BIN_NAME = "miqro"; //,basename(process.argv[0]);

export const usage = `usage: ${BIN_NAME} [...FLAGS] --service app/

==examples==

${BIN_NAME} --watch --service front/
PORT=8181 ${BIN_NAME} --service api/ --service front/
${BIN_NAME} --test --service front/
${BIN_NAME} --inflate --service front/
${BIN_NAME} --generate-doc --generate-doc-out API.md --service front/
CLUSTER_COUNT=10 ${BIN_NAME}-cluster --service api/`;

export const help = `
==flags==

-v, --version\t\toutputs the version number
-h, --help\t\toutputs this page.
--watch\t\t\tuse to enable the hot-reload functionality.
--test\t\t\trun the tests for a service.
--migrate-up\t\tmigrations up.
--migrate-down\t\tmigrations down.
--inflate\t\tinflates the application.
--inflate-dir\t\tto set the output directory of the --inflate command. default value is inflated/.
--editor\t\truns the application with a built-in editor.
--generate-doc\t\tgenerates a documentation for the api endpoints of the service.
--generate-doc-out\tthe output file for the generated documentation. default value is API.md.
--generate-doc-type\tthe format of the generated documentation. it can be JSON or MD. default value is MD.
--generate-doc-all\toutputs all the server routes in the documentation output.
--compile\t\tinflates the application and tries to create a NODE SEA binary.
--inflate-sea\t\tinflates the application with sea compilation scripts.
--install-tsconfig\tcreates a tsconfig.json configured to use with --install-types.
--install-types\t\tcreates and updates the .types/ folder use together with --install-tsconfig.
--disable-miqrojson\tdisables the load of miqro.json file.
--config\toverrides the default miqro.json path with a new one.

==environment variables==

PORT\t\t\toverride the default 8080 port.
LOG_FILE\t\toverride the default ./server.log file
DB\t\t\tenable the server.db features
DB_STORAGE\t\toverride the default local db location ./db.sqlite3
DB_DIALECT\t\toverride the default node:sqlite
DB_CONNECTION\t\toverride the default connection url
CLEAR_JSX_CACHE\t\tset to 1 or 0 to enable or disable the clearing of the esbuild cache defaults to 1.
JSX_TMP\t\t\tset custom location of esbuild builds defaults to /tmp/jsx_tmp.
`;
