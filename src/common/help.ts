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
--disable-etag\n\tuse to disable etag generation by default. each route can still enable this.
--enable-etag\n\tuse to enable etag generation by default. each route can still disable this. ( by default etag is enabled )
--watch\n\tuse to auto reload the server when files change.
--hot-reload\n\tenables the hot-reload functionality use with --watch.
--test\n\trun the tests for a service.
--migrate-up\n\tmigrations up.
--migrate-down\n\tmigrations down.
--inflate\n\tinflates the application into a directory using esbuild.
--inflate-dir\n\tto set the output directory of the --inflate command. default value is inflated/.
--editor\n\truns the application with a built-in editor.
--generate-doc\n\tgenerates a documentation for the api endpoints of the service.
--generate-doc-out\n\tthe output file for the generated documentation. default value is API.md.
--generate-doc-type\n\tthe format of the generated documentation. it can be JSON or MD. default value is MD.
--generate-doc-all\n\toutputs all the server routes in the documentation output.
--compile\n\tinflates the application and tries to create a NODE SEA binary.
--no-build\n\tdisables calling esbuild during imports in runtime. Notice that to use jsx you will need to run tsc or esbuild on your jsx files to transpile them to js.
--no-minify\n\tdisables calling minifing min.js files.
--inflate-only-assets\n\tinflates ONLY the application assets. must be used with --inflate.
--inflate-flat\n\tinflates files into the inflate-dir directly.
--inflate-sea\n\tinflates the application with sea compilation scripts.
--install-tsconfig\n\tcreates a tsconfig.json configured to use with --install-types.
--install-miqrojson\n\tcreates a default miqro.json file.
--install\n\tcreates a node_modules folder from binary cache (only available in sea binary).
--disable-miqrojson\n\tdisables the load of miqro.json file.
--log-file\n\toverrides the default log file from LOG_FILE.
--browser\n\toverrides the default browser from BROWSER.
--config\n\toverrides the default miqro.json path.
--port\n\toverrides the default port from PORT.
--name\n\toverrides the default name of the server.
--https\n\tserves the server in https instead of http
--https-key\n\tpoint to a server.key file for https.
--https-cert\n\tpoint to a server.cert file for https.
--https-redirect\n\tserves an aditional http server that redirects to https. it needs a port number.
--inflate-parallel\n\tsets the max parallel esbuild instances. defaults to 1.

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
