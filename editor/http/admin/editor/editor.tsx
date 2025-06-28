import { define } from "@miqro/jsx-dom";

//import "../../../../.types/browser.globals";
import { Editor } from "../../../components/editor.js";

window.addEventListener("load", async (event) => {
  define("editor-component", Editor, {
    shadowInit: false
  });
});
