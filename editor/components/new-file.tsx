import * as jsx from "@miqro/jsx";
import JSX from "@miqro/jsx";

import { BASEEDITOR_PATH } from "../common/constants.js";
import { TEMPLATES } from "../common/templates.js";
import { HighlightTextArea } from "./highlight-text-area.js";

export function NewFile(props: { migrations: string[]; services: string[]; open: boolean; ondone: (file?: string) => void; }) {

  const [template, settemplate] = jsx.useState("EMPTY");

  const refresh = jsx.useRefresh();

  const [service, setservice] = jsx.useState(props.services[0]);

  const nameInput = jsx.useRef();
  //const open = dialog ? dialog.open : false;

  /*jsx.useEffect(() => {
    if (dialog) {
      //console.log((dialogRef.current as any).open);
      if (open !== props.open) {
        if (nameInput.current) {
          nameInput.current.value = "";
          nameInput.current.focus();
        }
        if (props.open) {
          console.log("showModal");
          dialog.showModal();
          //(dialogRef.current as any).show();
        } else {
          console.log("closeModal");
          //dialog.close();
        }
      }
    }
  }, [dialog, open, props.open]);*/
  jsx.useEffect(() => {

    if (nameInput.current) {
      nameInput.current.value = "";
      nameInput.current.focus();
    }
  }, [nameInput.current]);

  function close(file?: string) {
    //console.log("closeModal");
    if (props.ondone) {
      props.ondone(file);
    }
  }


  let nextMigrationNumber = 1;
  if (props.migrations.length > 0) {
    const lastMigration = props.migrations[props.migrations.length - 1];
    const indexOfDash = lastMigration.indexOf("-");
    if (indexOfDash !== -1) {
      nextMigrationNumber = parseInt(lastMigration.substring(0, indexOfDash), 10) + 1;
    }
  }

  const httpPath = (TEMPLATES[template].filename ? TEMPLATES[template].filename : nameInput.current?.value) + (TEMPLATES[template].httpSufix ? TEMPLATES[template].httpSufix : "");

  const filename = (service ? service + "/" : "") + (service && TEMPLATES[template].prefix ? TEMPLATES[template].prefix + "/" : "") + (template === "MIGRATION" ? nextMigrationNumber + "-" : "") + (TEMPLATES[template].filename ? TEMPLATES[template].filename : nameInput.current?.value) + (TEMPLATES[template].sufix ? TEMPLATES[template].sufix : "");

  async function createNewFile() {
    if ((nameInput.current && nameInput.current.value) || TEMPLATES[template].filename) {
      const t = TEMPLATES[template];
      await fetch(BASEEDITOR_PATH + "/api/fs/write", {
        method: "POST",
        headers: {
          ["content-type"]: "application/json"
        },
        body: JSON.stringify({
          path: filename,
          contents: t.template ? t.template(filename, httpPath) : ""
        })
      });
      return filename;
    }
  }

  return <>
    {props.open ? <dialog
      class="new-dialog"
      open="">
      <div class="dialog-header">
        <h1>Create new File</h1>
      </div>
      <div class="dialog-body">
        <select
          value={service}
          oninput={ev => {
            ev.preventDefault();
            ev.stopPropagation();
            console.log(ev.target.value);
            setservice(ev.target.value);
          }}
          style="margin: 0; padding: 0; margin-left:auto; margin-right: var(--file-browser-separation); width: 100%; margin-top: var(--file-browser-separation); margin-bottom: var(--file-browser-separation);">
          <option value={""}></option>
          {props.services.map(service => <option value={service}>{service}</option>)}
        </select>
        <p
          style="margin: 0; margin-bottom: var(--file-browser-separation);"
        >{filename}</p>
        {!TEMPLATES[template].filename ? <form
          style="width: 100%;"
          onsubmit={async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const path = await createNewFile();
            close(path);
          }}>
          <input
            style="width: 100%;"
            onkeydown={ev => {
              if (ev.keyCode === 27) {
                // catch esc
                ev.stopPropagation();
                ev.preventDefault();
                close();
              }
              refresh();
            }}
            ref={nameInput}
            type="text"
            placeholder="...filename..." />
        </form> : <></>}
        <select
          value={template}
          oninput={ev => {
            ev.preventDefault();
            ev.stopPropagation();
            console.log(ev.target.value);
            settemplate(ev.target.value);
          }}
          style="margin: 0; padding: 0; margin-left:auto; margin-right: var(--file-browser-separation); width: 100%; margin-top: var(--file-browser-separation);">
          {Object.keys(TEMPLATES).map(templateName => <option value={templateName}>{TEMPLATES[templateName].displayName}</option>)}
        </select>
        {TEMPLATES[template].template ? <div
          class="new-dialog-preview">
          <HighlightTextArea
            content={TEMPLATES[template].template(filename, httpPath)}
            language={TEMPLATES[template].language}
            disabled="true" />
        </div> : <></>}
      </div>
      <div class="dialog-footer">
        <button
          class="btn danger"
          onclick={ev => {
            ev.preventDefault();
            ev.stopPropagation();
            close();
          }}>cancel</button>
        <button
          style="margin-left: auto;"
          class="btn active"
          onclick={async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const path = await createNewFile();
            close(path);
          }}>create</button>
      </div>
    </dialog> : <></>}
  </>
}

NewFile.asFragment = true;
NewFile.shadowInit = false;
