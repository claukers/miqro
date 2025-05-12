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
});
