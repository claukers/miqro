import { describe, it, beforeEach as before, afterEach as after } from "node:test";
import { strictEqual } from "assert";
import { Miqro } from "../../build/esm/src/lib.js";

describe("simple html inflate", () => {
  const port = 9999;
  let app;
  before(async () => {
    //console.log("before");
    if (app) {
      await app.stop();
    }
    app = null;
  });
  after(async () => {
    //console.log("after");
    try {
      if (app) {
        await app.stop();
      }
      app = null;
    } catch (e) {
      console.error(e);
    }
  });

  it("case 1 editor: false hotreload:false", async () => {
    try {
      app = new Miqro({
        editor: false,
        hotreload: false,
        port,
        name: "case 1",
        services: ["test/test-data/jsx"]
      });

      await app.inflate();
      await app.start();

      const response = await fetch(`http://localhost:${port}/jsx-case0.html`);

      strictEqual(response.ok, true);
      const data = (await response.text()).split(" ").map(h => h.trim().split("\n").map(h => h.trim()).join("")).join("");
      console.dir(data);
      strictEqual(data, "<!DOCTYPEhtml><html><body><p>Hello&#32;World&#33;</p></body></html>");
      strictEqual(response.ok, true);
      console.dir("asdd");
    } catch (e) {
      console.error(e);
    }

  });

  it("case 2 editor: false hotreload:true", async () => {
    app = new Miqro({
      editor: false,
      hotreload: true,
      port,
      name: "case 2",
      services: ["test/test-data/jsx"]
    });
    await app.inflate();
    await app.start();
    const response = await fetch(`http://localhost:${port}/jsx-case0.html`);
    strictEqual(response.ok, true);
    const data = (await response.text()).split(" ").map(h => h.trim().split("\n").map(h => h.trim()).join("")).join("");
    strictEqual(data, '<!DOCTYPEhtml><html><body><p>Hello&#32;World&#33;</p></body></html><script>//CreateWebSocketconnection.functiongetSocket(){returnnewWebSocket("/hot-reload");}constsocket=getSocket();lettimeout;functiontryConnection(){try{constnewSocket=getSocket();newSocket.addEventListener("open",(event)=>{console.log("reloading");window.location.reload();});newSocket.addEventListener("error",(err)=>{console.error(err);timeout=setTimeout(tryConnection,500);});}catch(e){console.error(e);timeout=setTimeout(tryConnection,500);}}//Connectionclosedsocket.addEventListener("close",(event)=>{clearTimeout(timeout);timeout=setTimeout(tryConnection,500);});socket.addEventListener("error",(err)=>{console.error(err);});</script>');
    strictEqual(response.ok, true);
  });

  it("case 3 editor: true hotreload:false", async () => {
    app = new Miqro({
      editor: true,
      hotreload: false,
      port,
      name: "case 3",
      services: ["test/test-data/jsx"]
    });
    await app.inflate();
    await app.start();
    const response = await fetch(`http://localhost:${port}/jsx-case0.html`);
    strictEqual(response.ok, true);
    const data = (await response.text()).split(" ").map(h => h.trim().split("\n").map(h => h.trim()).join("")).join("");
    strictEqual(data, "<!DOCTYPEhtml><html><body><p>Hello&#32;World&#33;</p></body></html>");
    strictEqual(response.ok, true);
  });

  it("case 5 editor: true hotreload:true", async () => {
    app = new Miqro({
      editor: true,
      hotreload: true,
      port,
      name: "case 3",
      services: ["test/test-data/jsx"]
    });
    await app.inflate();
    await app.start();
    const response = await fetch(`http://localhost:${port}/jsx-case0.html`);
    strictEqual(response.ok, true);
    const data = (await response.text()).split(" ").map(h => h.trim().split("\n").map(h => h.trim()).join("")).join("");
    strictEqual(data, '<!DOCTYPEhtml><html><body><p>Hello&#32;World&#33;</p></body></html><script>//CreateWebSocketconnection.functiongetSocket(){returnnewWebSocket("/hot-reload");}constsocket=getSocket();lettimeout;functiontryConnection(){try{constnewSocket=getSocket();newSocket.addEventListener("open",(event)=>{console.log("reloading");window.location.reload();});newSocket.addEventListener("error",(err)=>{console.error(err);timeout=setTimeout(tryConnection,500);});}catch(e){console.error(e);timeout=setTimeout(tryConnection,500);}}//Connectionclosedsocket.addEventListener("close",(event)=>{clearTimeout(timeout);timeout=setTimeout(tryConnection,500);});socket.addEventListener("error",(err)=>{console.error(err);});</script>');
    strictEqual(response.ok, true);
  });
})
