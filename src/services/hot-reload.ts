//import { checkEnvVariable } from "@miqro/core";

import { HOT_RELOAD_PATH, HOT_RELOAD_SCRIPT_PATH } from "../common/constants.js";

export const HOT_RELOAD_JS_SCRIPT = `
// Create WebSocket connection.

function getSocket() {
    return new WebSocket("${HOT_RELOAD_PATH}");
}

const socket = getSocket();

let timeout;
let reloadtimeout;

function tryConnection() {
    try {
        const newSocket = getSocket();
        newSocket.addEventListener("open", (event) => {
            console.log("reloading");
            reloadtimeout = setTimeout(()=>{
              window.location.reload();
            }, 500);
            
        });
        newSocket.addEventListener("error", (err) => {
            console.error(err);
            timeout = setTimeout(tryConnection, 500);
        });
    } catch (e) {
        console.error(e);
        timeout = setTimeout(tryConnection, 500);
    }
}

// Connection closed
socket.addEventListener("close", (event) => {
    clearTimeout(timeout);
    clearTimeout(reloadtimeout);
    timeout = setTimeout(tryConnection, 500);
});

socket.addEventListener("error", (err) => {
    clearTimeout(reloadtimeout);
    console.error(err);
});`;

export function getHotReloadScript() {
  return `<script src="${HOT_RELOAD_SCRIPT_PATH}"></script>`;
}

/*export function isHotReloadEnabled() {
  return checkEnvVariable("HOT_RELOAD", "0") === "1";
}*/
