import { describe, it } from "node:test";
import { strictEqual } from "assert";
import { Miqro } from "../../build/esm/src/lib.js";

describe("simple html inflate", () => {
  it("case 1 editor: false", async () => {
    const port = 9999;
    const app = new Miqro({
      editor: false,
      hotreload: false,
      port,
      name: "case 1 editor:false",
      services: ["test/test-data/jsx"]
    });
    await app.inflate();
    await app.start();
    const response = await fetch(`http://localhost:${port}/jsx-case0.html`);
    strictEqual(response.ok, true);
    await app.stop();
  });
})
