import * as jsx from "@miqro/jsx";
import JSX from "@miqro/jsx";

import { SUPPORTED_LANGUAGES } from "../common/constants.js";

interface FileEditorToolbar {
  path: string;
  language: string;
  changed: boolean;
  renameFile: (newName: string) => void;
  deleteFile: () => void;
  setlanguage: (newLang: string) => void;
  saveFile: (reload?: boolean) => void;
  revertFile: () => void;
  closeFile: () => void;
  togglePanel: (panel: string) => void;
  isPanelVisible: (panel: string) => boolean;
  disableLog?: boolean; disablePreview?: boolean; disableReload?: boolean;
}

export function FileEditorToolbar(props: FileEditorToolbar) {

  const renamingRef = jsx.useRef();
  const refresh = jsx.useRefresh();
  const [renaming, setrenaming] = jsx.useState<boolean>(false);

  jsx.useEffect(() => {
    if (renamingRef.current) {
      renamingRef.current.value = props.path;
      renamingRef.current.focus();
      refresh();
    }
  }, [renamingRef.current]);

  jsx.useEffect(() => {
    setrenaming(false);
  }, [props.path]);

  return <div class="file-editor-toolbar">
    <div class="file-editor-toolbar-row">
      <button
        class="file-editor-button btn"
        style={`${props.isPanelVisible("left") ? "display: none;" : "margin-right: var(--file-browser-separation);"}`}
        onclick={ev => {
          ev.preventDefault();
          props.togglePanel("left");
        }}>{">>"}</button>
      <button
        id="save-btn"
        disabled={!props.changed}
        class={`btn success`}
        onclick={ev => {
          ev.preventDefault();
          props.saveFile();
        }}>save</button>
      {props.disableReload ? <></> : <button
        id="savereload-btn"
        disabled={!props.changed}
        class={`btn info`}
        style="margin-left: var(--file-browser-separation);"
        onclick={ev => {
          ev.preventDefault();
          props.saveFile(true);
        }}>save/reload</button>}
      <button
        id="revert-btn"
        disabled={!props.changed}
        style="margin-left: var(--file-browser-separation);"
        class={`btn warning`}
        onclick={ev => {
          ev.preventDefault();
          props.revertFile();
        }}>revert</button>
      <button
        id="close-btn"
        class={`btn danger`}
        style="margin-left: var(--file-browser-separation);"
        onclick={ev => {
          ev.preventDefault();
          props.closeFile();

        }}>close</button>
      {SUPPORTED_LANGUAGES.includes(props.language) ?
        <select
          value={props.language}
          oninput={ev => {
            ev.preventDefault();
            props.setlanguage(ev.target.value);
          }}
          style="margin: 0; padding: 0; margin-left: calc(2*var(--file-browser-separation-file));">
          {SUPPORTED_LANGUAGES.map(language => <option value={language}>{language}</option>)}
        </select> : <></>}
      {/*<div
        style="margin-left: calc(2*var(--file-browser-separation));"
        class={`toggle-panel-button left-side-panel-button ${props.isPanelVisible("left") ? "active" : ""}`}
        onclick={ev => {
          ev.preventDefault();
          props.togglePanel("left");
        }}
      ></div>
      <br />
      <div
        style="margin-left: calc(2*var(--file-browser-separation-file));"
        class={`toggle-panel-button bottom-side-panel-button ${props.isPanelVisible("bottom") ? "active" : ""}`}
        onclick={ev => {
          ev.preventDefault();
          props.togglePanel("bottom");
        }}
      ></div>
      <br />
      <div class={`toggle-panel-button right-side-panel-button ${props.isPanelVisible("right") ? "active" : ""}`}
        onclick={ev => {
          ev.preventDefault();
          props.togglePanel("right");
        }}
      ></div>*/}


    </div>
    <div class="file-editor-toolbar-row">
      {!renaming ?
        <><p
          style="margin-left:20px;"
          onclick={ev => {
            ev.preventDefault();
            setrenaming(true);
          }}>{props.path}</p>
        </> :
        <>
          <form
            style="width: 100%; height: 100%; margin-right: calc(2 * var(--file-browser-separation));"
            onsubmit={ev => {
              ev.preventDefault();
              setrenaming(false);
              if (renamingRef.current && renamingRef.current.value !== props.path) {
                setrenaming(false);
                props.renameFile(renamingRef.current.value);
              }
            }}>
            <input
              style="width: 100%; height: 100%;"
              onfocusout={ev => {
                ev.preventDefault();
                //setrenaming(false);
              }}
              ref={renamingRef}
              onkeydown={(ev) => {
                if (ev.keyCode === 27) {
                  // catch esc
                  ev.preventDefault();
                  setrenaming(false);
                } else {
                  refresh();
                }
              }}
              type="text" />
          </form>
          {renamingRef.current && renamingRef.current.value !== props.path && renamingRef.current.value !== "" ?
            <button
              style="margin-left: var(--file-browser-separation);"
              class="btn info"
              onclick={ev => {
                ev.preventDefault();
                if (renamingRef.current) {
                  setrenaming(false);
                  props.renameFile(renamingRef.current.value);
                }
              }}>rename file</button>
            : <></>}
          <button
            style="margin-left: var(--file-browser-separation);"
            class="btn danger"
            onclick={ev => {
              ev.preventDefault();
              if (renamingRef.current) {
                setrenaming(false);
                props.deleteFile();
              }
            }}>delete file</button>
          <button
            style="margin-left: var(--file-browser-separation);"
            class="btn"
            onclick={ev => {
              ev.preventDefault();
              setrenaming(false);
            }}>cancel</button>
        </>
      }
    </div>
  </div>
}

FileEditorToolbar.asFragment = true;
FileEditorToolbar.shadowInit = false;
