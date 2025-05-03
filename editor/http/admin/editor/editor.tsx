//import "../../../../.types/browser.globals";
import { Editor } from "../../../components/editor.js";

window.addEventListener("load", async (event) => {
  jsx.define("editor-component", Editor, {
    shadowInit: false
  });
});
