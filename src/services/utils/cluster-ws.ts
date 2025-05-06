import { Logger, WebSocketServer, WebSocketServerOptions } from "@miqro/core";
import { Serializable } from "node:child_process";

const ClusterWebSocketServer2MessageType = "$$$$ClusterWebSocketServer2Message$$$$$";

export interface ClusterWebSocketServer2Message {
  type: typeof ClusterWebSocketServer2MessageType;
  target: string;
  action: "connection" | "disconnection" | "sendMessage" | "error" | "sync";
  clientUUID?: string;
  errorMessage?: string;
  fromUUID?: string;
  fromPID: string,
  payload?: Serializable;
}

export class ClusterWebSocketServer2 extends WebSocketServer {
  public remoteClients: Set<string> = new Set();
  listener: (data: any) => Promise<void>;
  public constructor(protected name: string, options: WebSocketServerOptions) {
    super({
      ...options,
      validate: (req) => {
        if (
          this.options.maxConnections !== undefined &&
          this.clients.size + this.remoteClients.size >= this.options.maxConnections
        ) {
          return false;
        } else {
          return options.validate ? options.validate(req) : true;
        }
      },
      onError: (req, error) => {
        if (process.send) {
          process.send({
            type: ClusterWebSocketServer2MessageType,
            action: "error",
            target: this.name,
            clientUUID: req.uuid,
            fromPID: String(process.pid),
            errorMessage: error.message
          } as ClusterWebSocketServer2Message);
        }
        if (options.onError) {
          options.onError(req, error);
        }
      },
      onConnection: (req) => {
        if (process.send) {
          process.send({
            type: ClusterWebSocketServer2MessageType,
            action: "connection",
            target: this.name,
            fromPID: String(process.pid),
            clientUUID: req.uuid
          } as ClusterWebSocketServer2Message);
        }
        if (options.onConnection) {
          options.onConnection(req);
        }
      },
      onDisconnect: (req) => {
        if (process.send) {
          process.send({
            type: ClusterWebSocketServer2MessageType,
            action: "disconnection",
            target: this.name,
            fromPID: String(process.pid),
            clientUUID: req.uuid
          } as ClusterWebSocketServer2Message);
        }
        if (options.onDisconnect) {
          options.onDisconnect(req);
        }
      }
    });
    this.listener = async (data) => {
      try {
        const msg = (data as ClusterWebSocketServer2Message);
        if (
          msg &&
          msg.type === ClusterWebSocketServer2MessageType &&
          msg.target === this.name &&
          msg.action) {
          // receive message from cluster workers
          //console.dir(data);
          //this.logger?.debug("remote web socket server message from [%s] [%s] [%s]", msg.fromPID, msg.target, msg.action);
          switch (msg.action) {
            case "sync":
              if (process.send) {
                for (const clientUUID of this.clients.keys()) {
                  process.send({
                    type: ClusterWebSocketServer2MessageType,
                    action: "connection",
                    target: this.name,
                    fromPID: String(process.pid),
                    clientUUID
                  } as ClusterWebSocketServer2Message);
                }
              }
              break;
            case "connection":
              if (!msg.clientUUID) {
                throw new Error(`action [${msg.action}] without clientUUID`);
              }
              if (!this.remoteClients.has(msg.clientUUID)) {
                this.remoteClients.add(msg.clientUUID);
              }
              break;
            case "disconnection":
              if (!msg.clientUUID) {
                throw new Error(`action [${msg.action}] without clientUUID`);
              }
              if (this.remoteClients.has(msg.clientUUID)) {
                this.remoteClients.delete(msg.clientUUID);
              }
              break;
            case "sendMessage": {
              const payload = String(msg.payload);
              if (!msg.clientUUID) {
                // broadcast to local clients
                await super.broadcast(payload, msg.fromUUID);
              } else if (this.isConnected(msg.clientUUID)) {
                // write if local client
                await super.writeTo(msg.clientUUID, payload);
              }
              break;
            }
            default:
              throw new Error(`action [${msg.action}] not supported`);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    this.connect();
  }

  public connect() {
    if (process.send) {
      process.removeListener("message", this.listener);
      process.on("message", this.listener);
      process.send({
        type: ClusterWebSocketServer2MessageType,
        action: "sync",
        fromPID: String(process.pid),
        target: this.name
      } as ClusterWebSocketServer2Message);
    }
  }

  public dispose() {
    process.removeListener("message", this.listener);
  }

  public async broadcast(payload: string, fromUUID?: string): Promise<void> {
    if (process.send) {
      process.send({
        type: ClusterWebSocketServer2MessageType,
        action: "sendMessage",
        payload,
        target: this.name,
        fromPID: String(process.pid),
        fromUUID
      } as ClusterWebSocketServer2Message);
    }
    return super.broadcast(payload, fromUUID);
  }

  public async writeTo(clientUUID: string, payload: string): Promise<void> {
    if (this.remoteClients.has(clientUUID)) {
      // write to remote client via IPC
      if (process.send) {
        process.send({
          type: ClusterWebSocketServer2MessageType,
          action: "sendMessage",
          clientUUID,
          target: this.name,
          fromPID: String(process.pid),
          payload
        } as ClusterWebSocketServer2Message);
        return;
      }
    }
    // due to the implementation of isUUIDValid depends on this.remoteClients to be sync there can be two clients registered with the same UUID in the cluster
    if (this.clients.has(clientUUID)) {
      // write to local client
      return super.writeTo(clientUUID, payload);
    }
  }

  public isUUIDValid(uuid: string) {
    return !this.clients.has(uuid) && !this.remoteClients.has(uuid);
  }
}
