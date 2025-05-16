import { describe, it, beforeEach as before, afterEach as after } from "node:test";
import { strictEqual } from "assert";
import { Miqro } from "../../build/esm/src/lib.js";

describe("simple html inflate", () => {

  it("case 1 index.html", async () => {
    try {
      const app = await Miqro.import("./test/cases/import-case/case1/miqro.json");
      await app.start();

      const response = await fetch(`http://localhost:${app.options.port}/index.html`);

      strictEqual(response.ok, true);
      const data = (await response.text()).split(" ").map(h => h.trim().split("\n").map(h => h.trim()).join("")).join("");
      console.dir(data);
      strictEqual(data, "<!DOCTYPEhtml><html><body><p>Hello</p></body></html>");
      strictEqual(response.ok, true);
      await app.stop();
    } catch (e) {
      console.error(e);
      await app.stop();
      throw e;
    }
  });

  it("case 1 /health", async () => {
    try {
      const app = await Miqro.import("./test/cases/import-case/case1/miqro.json");
      await app.start();

      const response = await fetch(`http://localhost:${app.options.port}/api/health/`);

      strictEqual(response.ok, true);
      const data = await response.json();
      console.dir(data);
      strictEqual(data.status, "OK");
      strictEqual(response.ok, true);
      await app.stop();
    } catch (e) {
      console.error(e);
      await app.stop();
      throw e;
    }
  });

  it("case 1 DB0 and /socket", async () => {
    try {
      const app = await Miqro.import("./test/cases/import-case/case1/miqro.json");
      await app.start();
      const db0 = app.dbManager.getDB("DB0");
      strictEqual(typeof db0.connect, "function");
      const ws1 = app.webSocketManager.getWS("/socket");
      strictEqual(typeof ws1.writeTo, "function");
      await app.stop();
    } catch (e) {
      console.error(e);
      await app.stop();
      throw e;
    }
  });

  it("case 2 two db defined and two ws", async () => {
    const app = await Miqro.import("./test/cases/import-case/case2/miqro.json");
    try {
      await app.start();

      const db1 = app.dbManager.getDB("DB1");

      const db2 = app.dbManager.getDB("DB2");

      strictEqual(typeof db1.connect, "function");
      strictEqual(typeof db2.connect, "function");

      const ws1 = app.webSocketManager.getWS("/socket1");
      console.dir(app.webSocketManager.map);

      const ws2 = app.webSocketManager.getWS("/socket2");

      strictEqual(typeof ws1.writeTo, "function");
      strictEqual(typeof ws2.writeTo, "function");
      await app.stop();

    } catch (e) {
      console.error(e);
      await app.stop();
      throw e;
    }
  });
});
