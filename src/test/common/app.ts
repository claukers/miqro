import { request, RequestOptions, RequestResponse } from "@miqro/core";

import { existsSync, unlinkSync } from "fs";
import { createServer, RequestListener } from "http";

export const TestHelper = async (app: {
  listener: RequestListener;
}, options: RequestOptions, cb?: (response: RequestResponse) => void): Promise<RequestResponse> => {
  const unixSocket = `/tmp/socket.test.helper${Date.now()}`;
  if (existsSync(unixSocket)) {
    unlinkSync(unixSocket);
  }
  const server = createServer(app.listener);
  return new Promise<RequestResponse>((resolve, reject) => {
    server.listen(unixSocket, () => {
      request({
        disableThrow: true,
        ...options,
        socketPath: unixSocket
      }).then((response) => {
        server.close(() => {
          if (cb) {
            try {
              cb(response);
            } catch (ee) {
              reject(ee);
            }
          }
          resolve(response);
        });
      }).catch((e: any) => {
        server.close(() => {
          if (cb) {
            try {
              cb(e as any);
            } catch (ee) {
              reject(ee);
            }
            resolve(undefined as any);
          } else {
            reject(e);
          }
        });
      });
    });
  });
}
