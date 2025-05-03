//import { checkEnvVariable } from "@miqro/core";

export function getHotReloadScript() {
  const HOT_RELOAD_JS_SCRIPT = `
// Create WebSocket connection.

function getSocket() {
    return new WebSocket("/hot-reload");
}

const socket = getSocket();

let timeout;

function tryConnection() {
    try {
        const newSocket = getSocket();
        newSocket.addEventListener("open", (event) => {
            console.log("reloading");
            window.location.reload();
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
    timeout = setTimeout(tryConnection, 500);
});

socket.addEventListener("error", (err) => {
    console.error(err);
});`;
  return `<script>${HOT_RELOAD_JS_SCRIPT}</script>`;
}

/*export function isHotReloadEnabled() {
  return checkEnvVariable("HOT_RELOAD", "0") === "1";
}*/
