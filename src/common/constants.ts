export const EXIT_CODES = {
  BAD_ARGUMENTS: 10,
  NORMAL_EXIT: 0,
  GLOBALS_ALTERED: 80,
  ABNORMAL: 98,
  ABNORMAL_UNCONTROLLED: 99,
  TEST_FAILED: 30,
}

export const CLEAR_JSX_CACHE = (process.env["CLEAR_JSX_CACHE"] !== undefined ? process.env["CLEAR_JSX_CACHE"] : "1") === "1";

export const EDITOR_CONFIG_KEY = "$$editor$$";

export const HOT_RELOAD_PATH = "/hot-reload";
export const HOT_RELOAD_SCRIPT_PATH = "/hot-reload.js";

//export const SERVER_IDENTIFIER = cluster.isPrimary ? "SERVER" : process.env["CLUSTER_NODE_NUMBER"] ? `WORKER_${process.env["CLUSTER_NODE_NUMBER"]}` : "WORKER";

//export const DB_IDENTIFIER = cluster.isPrimary ? "DATABASE" : process.env["CLUSTER_NODE_NUMBER"] ? `WORKER_${process.env["CLUSTER_NODE_NUMBER"]}_DATABASE` : "WORKER_DATABASE";
