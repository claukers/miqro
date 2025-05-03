import { Logger } from "@miqro/core";
import { CacheInterface } from "../../types.js";

export class LocalCache implements CacheInterface {
  private localCache = new Map<string, unknown>();

  constructor(public name: string, public logger?: Logger) {
  }

  dispose() {

  }

  get<T = any>(key: string): T | undefined {
    this.logger?.trace("get(%s)", key);
    return this.localCache.get(key) as T;
  }
  set(key: string, value: unknown): void {
    this.localCache.set(key, value);
    this.logger?.trace("set(%s, ...)", key);
  }
  unset(key: string): void {
    this.logger?.trace("unset(%s)", key);
    this.localCache.delete(key);
  }
  has(key: string): boolean {
    this.logger?.trace("has(%s)", key);
    return this.localCache.has(key);
  }

  set_add(key: string, value: unknown): void {
    this.logger?.trace("set_add(%s)", key);
    const list = this.localCache.has(key) ? this.localCache.get(key) : new Set<string>();
    if (!(list instanceof Set)) {
      throw new Error("cannot apply on non Set");
    }
    if (list.has(value)) {
      list.add(value);
    }
    this.localCache.set(key, list);
  }
  set_delete(key: string, value: unknown): void {
    this.logger?.trace("set_delete(%s)", key);
    const list = this.localCache.has(key) ? this.localCache.get(key) : new Set<string>();
    if (!(list instanceof Set)) {
      throw new Error("cannot apply on non Set");
    }
    if (list.has(value)) {
      list.delete(value);
    }
    this.localCache.set(key, list);
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
  }
  array_clear(key: string): void {
    this.logger?.trace("array_clear(%s)", key);
    if (this.localCache.has(key) && !(this.localCache.get(key) instanceof Array)) {
      throw new Error("cannot apply on non Array");
    }
    this.localCache.set(key, []);
  }
}
