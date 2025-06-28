import { Component, enableDebugLog, Fragment, Props, createElement as realCreateElement } from "@miqro/jsx";
import { jsx2HTML } from "./common/jsx.js";

/*export * from "@miqro/core";
export * from "@miqro/query";*/
export * from "./types.js";

export { ClusterWebSocketServer2 } from "./services/utils/cluster-ws.js";
export { ClusterCache } from "./services/utils/cluster-cache.js";
export { LocalCache } from "./services/utils/cache.js";
export { WebSocketManager, WebSocketManagerOptions } from "./services/utils/websocketmanager.js";
export { DBManager } from "./services/utils/db-manager.js";
export { LogProvider, LogProviderOptions } from "./services/utils/log.js";
export { Miqro, MiqroOptions, ServerRequestHandler } from "./services/app.js";
// export { initGlobals, assertGlobalTampered } from "./services/globals.js";
export { jsx2HTML } from "./common/jsx.js";

//exported for --inflate-sea
export { appendAPIModule } from "./inflate/utils/sea-utils.js";
export { createServerInterface, ServerInterfaceImplOptions } from "./services/utils/server-interface.js";
export { App, LoggerHandler, Router } from "@miqro/core";
export { migration } from "@miqro/query";
export { middleware } from "./services/utils/middleware.js";
export { jwt } from "./services/utils/jwt.js";
export const JSX = {
  createElement: (...args: [tag: string | Component | typeof Fragment, attributes: Props | null | undefined, ...children: Array<any>]) => {
    const ret = realCreateElement(...args);
    ret.toString = () => jsx2HTML(ret)
    return ret;
  },
  Fragment,
  enableDebugLog
}
export * as jsx from "@miqro/jsx";
