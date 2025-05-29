import { describe, it } from "node:test";
import { strictEqual } from "assert";
import { initGlobals } from "../../build/esm/src/lib.js";

describe("simple jwt jose integration tests", () => {

  it("sign / verify / decode", async () => {
    initGlobals();
    const payload = {
      someData: "1"
    }
    /*const secret = new TextEncoder().encode(
      'cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2',
    )*/

    const secret = server.createSecretKey("secretkey", 'utf-8');
    //console.dir(secret);
    const token = await server.jwt.sign(payload, secret);
    //console.dir(token);
    const result = await server.jwt.verify(token, secret);
    //console.dir(result);
    strictEqual(result.payload.someData, "1");

    const decoed = await server.jwt.decode(token);
    //console.dir(decoed);
    strictEqual(decoed.someData, "1");
  });

  it("encrypt / decrypt", async () => {
    initGlobals();
    const payload = {
      someData: "1"
    }
    /*const secret = new TextEncoder().encode(
      'cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2',
    )*/

    const secret = server.createSecretKey("secretkeysecretkeysecretkeysecre", 'utf-8');
    //console.dir(secret);
    const encrypted = await server.jwt.encrypt(payload, secret);
    //console.dir(encrypted);
    const decrypted = await server.jwt.decrypt(encrypted, secret);
    strictEqual(decrypted.payload.someData, "1");
    //console.dir(decrypted);
  });
});
