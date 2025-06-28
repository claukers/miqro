import { describe, it, beforeEach as before, afterEach as after } from "node:test";
import { strictEqual } from "assert";
import { createElement } from "@miqro/jsx";
import { Editor } from "../../build/esm/editor/components/editor.js";
import { createNodeRuntime, HTMLEncode } from "@miqro/jsx-node";
//import { initGlobals } from "../../build/esm/src/lib.js";
import { randomUUID } from "crypto";

describe("simple editor toolbar button hide tests", () => {
  before(async () => {
    //initGlobals();
  });
  after(async () => {
  });

  it("case 1 disablelog:true disablepreview:true, disablereload:true", async () => {
    const runtime = createNodeRuntime();
    const root = runtime.createElement("root");
    const container = runtime.createContainer(root);
    const uuid = randomUUID();
    const migrations = [];
    const services = [];
    const errors = [];
    const files = [];
    container.render(createElement(Editor, {
      disablelog: "true",
      disablepreview: "true",
      disablereload: "true",
      class: "main-container",
      reloadString: `${uuid}`,
      migrations: `${JSON.stringify(migrations)}`,
      services: `${JSON.stringify(services)}`,
      errors: `${JSON.stringify(errors)}`,
      files: `${JSON.stringify(files)}`
    }));
    //strictEqual(root.toString(), "");
    //console.dir(runtime.getElementById("reload-btn"));
    strictEqual(runtime.getElementById("closeall-btn") !== null, true);
    strictEqual(runtime.getElementById("reload-btn") !== null, false);
    strictEqual(runtime.getElementById("preview-btn") !== null, false);
    strictEqual(runtime.getElementById("log-btn") !== null, false);
    container.disconnect();
  });

  it("case 2 disablelog:true disablepreview:false, disablereload:true", async () => {
    const runtime = createNodeRuntime();
    const root = runtime.createElement("root");
    const container = runtime.createContainer(root);
    const uuid = randomUUID();
    const migrations = [];
    const services = [];
    const errors = [];
    const files = [];
    container.render(createElement(Editor, {
      disablelog: "true",
      //disablepreview: "true",
      disablereload: "true",
      class: "main-container",
      reloadString: `${uuid}`,
      migrations: `${JSON.stringify(migrations)}`,
      services: `${JSON.stringify(services)}`,
      errors: `${JSON.stringify(errors)}`,
      files: `${JSON.stringify(files)}`
    }));
    //strictEqual(root.toString(), "");
    //console.dir(runtime.getElementById("reload-btn"));
    strictEqual(runtime.getElementById("closeall-btn") !== null, true);
    strictEqual(runtime.getElementById("reload-btn") !== null, false);
    strictEqual(runtime.getElementById("preview-btn") !== null, true);
    strictEqual(runtime.getElementById("log-btn") !== null, false);
    container.disconnect();
  });

  it("case 3 disablelog:true disablepreview:false, disablereload:false", async () => {
    const runtime = createNodeRuntime();
    const root = runtime.createElement("root");
    const container = runtime.createContainer(root);
    const uuid = randomUUID();
    const migrations = [];
    const services = [];
    const errors = [];
    const files = [];
    container.render(createElement(Editor, {
      disablelog: "true",
      //disablepreview: "true",
      //disablereload: "true",
      class: "main-container",
      reloadString: `${uuid}`,
      migrations: `${JSON.stringify(migrations)}`,
      services: `${JSON.stringify(services)}`,
      errors: `${JSON.stringify(errors)}`,
      files: `${JSON.stringify(files)}`
    }));
    //strictEqual(root.toString(), "");
    //console.dir(runtime.getElementById("reload-btn"));
    strictEqual(runtime.getElementById("closeall-btn") !== null, true);
    strictEqual(runtime.getElementById("reload-btn") !== null, true);
    strictEqual(runtime.getElementById("preview-btn") !== null, true);
    strictEqual(runtime.getElementById("log-btn") !== null, false);
    container.disconnect();
  });

});
