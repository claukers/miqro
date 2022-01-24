const { mainCMD, extractFlags } = require("../dist/utils");
const { strictEqual } = require("assert");
const { fake } = require("@miqro/test");


it("cli happy path", async () => {
  const cb = fake(() => {

  });
  mainCMD({
    "cmd": {
      description: "description",
      cb
    }
  }, "usage", console, "cmd");
  strictEqual(cb.callCount, 1);
});

it("cli happy path cmd not found", async () => {
  const cb = fake(() => {

  });
  mainCMD({
    "cmd": {
      description: "description",
      cb
    }
  }, "usage", console, "cmd2", false);
  strictEqual(cb.callCount, 0);
});

it("cli happy path extract flags", async () => {
  const ret = extractFlags(["-b", "b", "cmd1", "cmd2", "cmd3", "--b-b", "bb", "cmd4", "-c-c", "ccc", "-n", "n1", "-n", "n2"]);
  strictEqual(ret.files.length, 4);
  strictEqual(Object.keys(ret.flags).length, 4);
  strictEqual(ret.flags.n[0], "n1");
  strictEqual(ret.flags.n[1], "n2");
  strictEqual(ret.flags.b, "b");
  strictEqual(ret.flags["c-c"], "ccc");
  strictEqual(ret.flags["b-b"], "bb");
});

it("cli happy path cmd not command", async () => {
  const cb = fake(() => {

  });
  mainCMD({
    "cmd": {
      description: "description",
      cb
    }
  }, "usage", console, "", false);
  strictEqual(cb.callCount, 0);
});

it("cli happy path cmd throws", async () => {
  const cb = fake(() => {
    throw new Error("bla");
  });
  mainCMD({
    "cmd": {
      description: "description",
      cb
    }
  }, "usage", console, "cmd", false);
  strictEqual(cb.callCount, 1);
});