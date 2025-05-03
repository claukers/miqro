import { strictEqual } from "node:assert";

describe("empty test group", () => {

  it("sample test1", async () => {
    await test.jsx.test(async (container, root, runtime) => {
      function SomeComponent() {
        return <p id="test-id">HelloWorld</p>
      }
      container.render(<SomeComponent />);
      strictEqual(runtime.getElementById("test-id").textContent, "HelloWorld");
    });
  });
});
