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

-v, --version\n\toutputs the version number
-h, --help\n\toutputs this page.
--watch\n\tuse to enable the hot-reload functionality.
--test\n\trun the tests for a service.
--migrate-up\n\tmigrations up.
--migrate-down\n\tmigrations down.
--inflate\n\tinflates the application.
--inflate-dir\n\tto set the output directory of the --inflate command. default value is inflated/.
--editor\n\truns the application with a built-in editor.
--generate-doc\n\tgenerates a documentation for the api endpoints of the service.
--generate-doc-out\n\tthe output file for the generated documentation. default value is API.md.
--generate-doc-type\n\tthe format of the generated documentation. it can be JSON or MD. default value is MD.
--generate-doc-all\n\toutputs all the server routes in the documentation output.
--compile\n\tinflates the application and tries to create a NODE SEA binary.
--inflate-sea\n\tinflates the application with sea compilation scripts.
--install-tsconfig\n\tcreates a tsconfig.json configured to use with --install-types.
--install-types\n\tcreates and updates the .types/ folder use together with --install-tsconfig.
--install-miqrojson\n\tcreates a default miqro.json file.
--disable-miqrojson\n\tdisables the load of miqro.json file.
--log-file\n\toverrides the default log file from LOG_FILE.
--browser\n\toverrides the default browser from BROWSER.
--config\n\toverrides the default miqro.json path.
--port\n\toverrides the default port from PORT.
--name\n\toverrides the default name of the server.

==environment variables==

PORT\n\toverride the default 8080 port.
BROWSER\n\toverride the default browser. change to none to disable.".
LOG_FILE\n\toverride the default ./server.log file
DB\n\tenable the server.db features
DB_STORAGE\n\toverride the default local db location ./db.sqlite3
DB_DIALECT\n\toverride the default node:sqlite
DB_CONNECTION\n\toverride the default connection url
CLEAR_JSX_CACHE\n\tset to 1 or 0 to enable or disable the clearing of the esbuild cache defaults to 1.
JSX_TMP\n\tset custom location of esbuild builds defaults to /tmp/jsx_tmp.
`;
