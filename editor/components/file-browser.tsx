interface FileBrowserFile {
  filePath: string;
  fileName: string;
  language: string;
  content?: string;
  dirs: string[];
}

interface FileBrowserProps {
  filter: string;
  migrations: string[];
  current: string;
  isDirCollapsed: (dir: string) => boolean;
  toggleCollapseDir: (dir: string) => void;
  saveAll: () => void;
  isOpen: (file: string) => boolean;
  openFile: (file: string) => void;
  setfilter: (newFilter) => void;
  showNewFile: () => void;
  scanFiles: () => void;
  closeAll: () => void;
  closeFile: (file: string) => void;
  reloadServer: () => void;
  hasFileContentChanged: (file: string) => boolean;
  hasErrors: (file: string) => boolean;
  files: FileBrowserFile[];
  opened: {
    fileName: string;
    filePath: string;
  }[];
  isPanelVisible: (panel: string) => boolean;
  togglePanel: (panel: string) => void;
  disableLog?: boolean; disablePreview?: boolean; disableReload?: boolean;
}

export function FileBrowser(props: FileBrowserProps) {
  return <div class="file-browser" style={`${!props.isPanelVisible("left") ? "display: none;" : ""}`}>
    <div class="file-browser-toolbar">
      <div class="row">
        <button
          class="file-editor-button btn"
          style={`width: 10%;${props.disableReload ? "width: 30%;" : ""}`}
          onclick={ev => {
            ev.preventDefault();
            props.togglePanel("left");
          }}>{"<<"}</button>
        {props.disableLog ? <></> :
          <button
            id="log-btn"
            class="file-editor-button btn"
            style={`width: 30%;${props.disableLog ? "display: none;" : ""}`}
            onclick={ev => {
              ev.preventDefault();
              props.togglePanel("bottom");
            }}>log</button>}
        {props.disableReload ? <></> :
          <button
            id="scan-btn"
            class="file-editor-button btn active"
            style={`width: 30%;${props.disableReload ? "display: none;" : ""}`}
            onclick={ev => {
              ev.preventDefault();
              props.scanFiles();
            }}>scan</button>}
        {props.disableReload ? <></> :
          <button
            id="reload-btn"
            class="file-editor-button btn warning"
            style={`width: 30%;${props.disableReload ? "display: none;" : ""}`}
            onclick={ev => {
              ev.preventDefault();
              props.reloadServer();
            }}>reload</button>}
      </div>
      <div class="row">
        <input
          type="text"
          style="width: 100%;"
          value={props.filter}
          oninput={ev => {
            ev.preventDefault();
            const text = ev.target.value;
            props.setfilter(text);
          }}
          placeholder={"..filter.."} />
      </div>
      <div class="row">
        {props.disablePreview ? <></> :
          <button
            id="preview-btn"
            class="file-editor-button btn"
            style={`width: 30%;${props.disablePreview ? "display: none;" : ""}`}
            onclick={ev => {
              ev.preventDefault();
              props.togglePanel("right");
            }}>preview</button>}
        <button
          id="new-btn"
          class="file-editor-button btn info"
          style="width: 20%;"
          onclick={ev => {
            ev.preventDefault();
            props.showNewFile();
          }}>new</button>
        {props.disableReload ? <></> :
          <button
            id="scan-btn"
            class="file-editor-button btn active"
            style={`width: 30%;${!props.disableReload ? "display: none;" : ""}`}
            onclick={ev => {
              ev.preventDefault();
              props.scanFiles();
            }}>scan</button>}
        <button
          id="saveall-btn"
          class="file-editor-button btn success"
          style="width: 25%;"
          onclick={ev => {
            ev.preventDefault();
            props.saveAll();

          }}>save</button>
        <button
          id="closeall-btn"
          class="file-editor-button btn danger"
          style="width: 25%;"
          onclick={ev => {
            ev.preventDefault();
            props.closeAll();
          }}>close</button>
      </div>
    </div>

    <div class="file-browser-files">
      {props.opened.length > 0 ? <div class="file-browser-opened-files" style="padding: var(--file-browser-separation);">
        {/*<p style="padding: 0; margin: 0;">opened</p>*/}
        <ul style="padding: 0; margin: 0;">
          {props.opened.map(file => <File
            closeFile={props.closeFile}
            current={props.current}
            fileName={file.fileName}
            filePath={file.filePath}
            hasErrors={props.hasErrors}
            hasFileContentChanged={props.hasFileContentChanged}
            isOpen={props.isOpen}
            openFile={props.openFile} />)}
        </ul></div> : <></>}
      <FileTree
        isDirCollapsed={props.isDirCollapsed}
        toggleCollapseDir={props.toggleCollapseDir}
        closeFile={props.closeFile}
        current={props.current}
        files={props.files}
        filter={props.filter}
        hasErrors={props.hasErrors}
        hasFileContentChanged={props.hasFileContentChanged}
        isOpen={props.isOpen}
        openFile={props.openFile} />
    </div>
  </div>
}

interface FileTreeProps {
  isDirCollapsed: (dir: string) => boolean;
  toggleCollapseDir: (dir: string) => void;
  current: string;
  files: FileBrowserFile[];
  filter: string;
  isOpen: (file: string) => boolean;
  openFile: (file: string) => void;
  closeFile: (file: string) => void;
  hasErrors: (file: string) => boolean;
  hasFileContentChanged: (file: string) => boolean;
}

interface FileTreeDir {
  dirs: {
    [name: string]: FileTreeDir
  };
  files: FileBrowserFile[];
  name: string;
  fullName: string;
}

function FileTree(props: FileTreeProps) {
  const ret: FileTreeDir = {
    dirs: {},
    files: [],
    name: "",
    fullName: ""
  };

  props.files.forEach((file) => {
    let cDir = ret;
    let fullName = "";
    for (const dir of file.dirs) {
      fullName += dir + "/";
      if (cDir.dirs[dir] === undefined) {
        const newDir: FileTreeDir = {
          dirs: {},
          files: [],
          name: dir,
          fullName: `${fullName}`
        };
        cDir.dirs[dir] = newDir;
        cDir = newDir;
      } else {
        cDir = cDir.dirs[dir];
      }
    }
    cDir.files.push(file);
  });

  //console.dir(ret);

  return <FileTreeFolder {...props} tree={ret} level={0} />
}

interface FileTreeFolderProps {
  isDirCollapsed: (dir: string) => boolean;
  toggleCollapseDir: (dir: string) => void;
  tree: FileTreeDir;
  current: string;
  filter: string;
  level: number;
  isOpen: (file: string) => boolean;
  openFile: (file: string) => void;
  closeFile: (file: string) => void;
  hasErrors: (file: string) => boolean;
  hasFileContentChanged: (file: string) => boolean;
}

function FileTreeFolder(props: FileTreeFolderProps) {

  //console.dir(props.tree);

  const dirs = Object.keys(props.tree.dirs).map(k => props.tree.dirs[k]);

  const files = props.tree.files.filter(file => props.filter ? file.filePath.includes(props.filter) : true);


  return <ul style={`margin-left: calc(2 * var(--file-browser-separation-file));${props.level === 0 ? " padding: var(--file-browser-separation);" : ""}`}>
    <>
      {props.tree.name !== "" ? <div class="file-browser-dir" style="padding: 0;">
        <p style="margin: 0;">{props.tree.name}/</p>
        <button
          onclick={ev => {
            ev.preventDefault();
            ev.stopPropagation();
            props.toggleCollapseDir(props.tree.fullName);
          }}
          class="btn-small"
          style={"margin: 0; margin-left: calc(2 * var(--file-browser-separation));"}>{props.isDirCollapsed(props.tree.fullName) ? "+" : "-"}</button>
      </div> : <></>}
      {props.isDirCollapsed(props.tree.fullName) ? <></> :
        <>
          {dirs.map(dir => {
            return <FileTreeFolder {...props} tree={dir} level={props.level + 1} />
          })}
          {files.map(file => <File
            closeFile={props.closeFile}
            current={props.current}
            fileName={file.fileName}
            filePath={file.filePath}
            hasErrors={props.hasErrors}
            hasFileContentChanged={props.hasFileContentChanged}
            isOpen={props.isOpen}
            openFile={props.openFile} />)
          }
        </>}
    </>
  </ul>
}

interface FileProps {
  fileName: string;
  filePath: string;
  current: string;
  isOpen: (file: string) => boolean;
  openFile: (file: string) => void;
  closeFile: (file: string) => void;
  hasErrors: (file: string) => boolean;
  hasFileContentChanged: (file: string) => boolean;
}

function File(props: FileProps) {
  const isOpen = props.isOpen(props.filePath);

  return <li
    class={`file-browser-file${props.hasErrors(props.filePath) ? " error" : ""}${props.hasFileContentChanged(props.filePath) ? " changed" : ""}${props.current === props.filePath ? " active" : ""}${isOpen ? " open" : ""}`}
    style={"display: flex; justify-content: flex-start; align-items: center; margin-left: calc(2 * var(--file-browser-separation-file));"}
    onclick={ev => {
      ev.preventDefault();
      ev.stopPropagation();
      props.openFile(props.filePath);
    }}>
    <p style="margin: 0; padding: 0;">{props.fileName}{props.hasFileContentChanged(props.filePath) ? "(*)" : ""}</p>
    <button
      onclick={ev => {
        ev.preventDefault();
        ev.stopPropagation();
        props.closeFile(props.filePath);
      }}
      class="btn-small"
      style={props.isOpen(props.filePath) ? "margin-left: calc(2 * var(--file-browser-separation-file));" : "display: none;"}
      disabled={!props.isOpen(props.filePath)}>X</button>
  </li>
}
