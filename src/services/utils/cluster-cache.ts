import { Logger } from "@miqro/core";
import { CacheInterface } from "../../types.js";

const ClusterCacheType = "$$$$$$$$$$$ClusterCacheType$$$$$$$$$$$";

interface ClusterCacheMessage {
  type: typeof ClusterCacheType;
  target: string;
  action: "set" | "unset" | "set_add" | "set_delete" | "array_push";
  fromPID: number;
  key: string;
  value?: string;
}

export class ClusterCache implements CacheInterface {
  private localCache = new Map<string, unknown>();
  //private logger: Logger;
  listener: (data: any) => Promise<void>;

  constructor(public name: string, public logger?: Logger) {
    this.listener = async (data) => {
      try {
        const msg = (data as ClusterCacheMessage);

        //console.dir(msg);
        if (
          msg &&
          msg.key &&
          msg.action &&
          msg.type === ClusterCacheType &&
          msg.fromPID !== process.pid,
          (msg.action === "set_add" || msg.action === "set" || msg.action === "unset" || msg.action === "set_delete" || msg.action === "array_push") &&
          msg.target === this.name) {
          this.logger?.debug("remote cluster cache message from [%s] [%s] [%s] [%s]", msg.fromPID, msg.target, msg.action, msg.key);
          switch (msg.action) {
            case "unset":
              this.localCache.delete(msg.key);
              break;
            case "set":
              this.localCache.set(msg.key, msg.value);
              break;
            case "set_add": {
              //this.localCache.set(msg.key, msg.value);
              const list = this.localCache.has(msg.key) ? this.localCache.get(msg.key) : new Set<string>();
              if (!(list instanceof Set)) {
                throw new Error("cannot apply push on non array");
              }
              if (list.has(msg.value)) {
                list.add(msg.value);
              }
              this.localCache.set(msg.key, list);
              break;
            }
            case "set_delete": {
              //this.localCache.set(msg.key, msg.value);
              const list = this.localCache.has(msg.key) ? this.localCache.get(msg.key) : new Set<string>();
              if (!(list instanceof Set)) {
                throw new Error("cannot apply push on non array");
              }
              if (list.has(msg.value)) {
                list.delete(msg.value);
              }
              this.localCache.set(msg.key, list);
              break;
            }
            case "array_push": {
              //this.localCache.set(msg.key, msg.value);
              const list = this.localCache.has(msg.key) ? this.localCache.get(msg.key) : [];
              if (!(list instanceof Array)) {
                throw new Error("cannot apply push on non array");
              }
              list.push(msg.value);
              this.localCache.set(msg.key, list);
              break;
            }
          }
        }
      } catch (e) {
        this.logger?.error(e);
      }
    };
    if (process.send) {
      process.on("message", this.listener);
    }
  }

  dispose() {
    process.removeListener("message", this.listener);
  }

  get<T = any>(key: string): T | undefined {
    this.logger?.trace("get(%s)", key);
    return this.localCache.get(key) as T;
  }
  set(key: string, value: unknown): void {
    this.localCache.set(key, value);
    this.logger?.trace("set(%s, ...)", key);
    if (process.send) {
      setTimeout(() => {
        process.send({
          type: ClusterCacheType,
          action: "set",
          target: this.name,
          fromPID: process.pid,
          key,
          value
        } as ClusterCacheMessage);
      }, 10);
    }
  }
  unset(key: string): void {
    this.logger?.trace("unset(%s)", key);
    this.localCache.delete(key);
    if (process.send) {
      setTimeout(() => {
        process.send({
          type: ClusterCacheType,
          target: this.name,
          action: "unset",
          fromPID: process.pid,
          key
        } as ClusterCacheMessage);
      }, 10);
    }
  }
  has(key: string): boolean {
    this.logger?.trace("has(%s)", key);
    return this.localCache.has(key);
  }

  set_add(key: string, value: unknown): void {
    this.logger?.trace("push(%s)", key);
    const list = this.localCache.has(key) ? this.localCache.get(key) : new Set<string>();
    if (!(list instanceof Set)) {
      throw new Error("cannot apply on non Set");
    }
    if (list.has(value)) {
      list.add(value);
    }
    this.localCache.set(key, list);

    if (process.send) {
      setTimeout(() => {
        process.send({
          type: ClusterCacheType,
          target: this.name,
          action: "set_add",
          fromPID: process.pid,
          key,
          value
        } as ClusterCacheMessage);
      }, 10);
    }
  }
  set_delete(key: string, value: unknown): void {
    this.logger?.trace("delete(%s)", key);
    const list = this.localCache.has(key) ? this.localCache.get(key) : new Set<string>();
    if (!(list instanceof Set)) {
      throw new Error("cannot apply on non Set");
    }
    if (list.has(value)) {
      list.delete(value);
    }
    this.localCache.set(key, list);
    if (process.send) {
      setTimeout(() => {
        process.send({
          type: ClusterCacheType,
          target: this.name,
          action: "set_delete",
          fromPID: process.pid,
          key,
          value
        } as ClusterCacheMessage);
      }, 10);
    }
  }
  set_has(key: string, value: unknown): boolean {
    this.logger?.trace("set_has(%s)", key);
    const list = this.localCache.has(key) ? this.localCache.get(key) : new Set<string>();
    if (!(list instanceof Set)) {
      throw new Error("cannot apply on non Set");
    }
    const ret = list.has(value);
    this.localCache.set(key, list);
    return ret;
  }
  set_clear(key: string): void {
    this.logger?.trace("set_clear(%s)", key);
    const list = this.localCache.has(key) ? this.localCache.get(key) : new Set<string>();
    if (!(list instanceof Set)) {
      throw new Error("cannot apply on non Set");
    }
    list.clear();
    this.localCache.set(key, list);
  }
  array_push(key: string, value: unknown): void {
    this.logger?.trace("array_push(%s)", key);
    const list = this.localCache.has(key) ? this.localCache.get(key) : [];
    if (!(list instanceof Array)) {
      throw new Error("cannot apply on non Array");
    }
    list.push(value);
    this.localCache.set(key, list);
    if (process.send) {
      setTimeout(() => {
        process.send({
          type: ClusterCacheType,
          target: this.name,
          action: "array_push",
          fromPID: process.pid,
          key,
          value
        } as ClusterCacheMessage);
      }, 10);
    }
  }
  array_clear(key: string): void {
    this.logger?.trace("array_clear(%s)", key);
    if (this.localCache.has(key) && !(this.localCache.get(key) instanceof Array)) {
      throw new Error("cannot apply on non Array");
    }
    this.localCache.set(key, []);
  }
}
