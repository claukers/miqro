import "./jsx.globals.js";
import { RuntimeElementDefinitionOptions, Component } from "@miqro/jsx/esm/lib.js";

declare global {
  // only available browser side
  var jsx: {
    define: (tagName: string, component: Component, options?: RuntimeElementDefinitionOptions) => void;
  }
}
