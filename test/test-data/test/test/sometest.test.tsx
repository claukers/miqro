import { strictEqual } from "node:assert";

describe("test group", () => {
  it("sample test1", async () => {
    const response = await testhelper.request({
      url: "/index.html"
    });
    strictEqual(response.status, 200);
  });

  it("sample test2", async () => {
    await testhelper.jsx.test(async (container, root, runtime) => {
      function SomeComponent() {
        return <p id="test-id">HelloWorld</p>
      }
      container.render(<SomeComponent />);
      strictEqual(runtime.getElementById("test-id").textContent, "HelloWorld");
    });
  });
});
