import { FileEditor } from "./file-editor.js";
import { NewFile } from "./new-file.js";
import { useScroll } from "./scroll-query.js";
import { useFilterQuery } from "./filter-query.js";
import { FileBrowser } from "./file-browser.js";
import { StartPage } from "./start-page.js";
import { BASEEDITOR_PATH } from "../common/constants.js";
import { LogViewer } from "./log-viewer.js";
import { useLogSocket } from "../common/log-socket.js";

function InflateError2Map(errors: {
  filePath: string;
  error: string;
}[]) {
  const errorMap: {
    [filePath: string]: {
      error: string
    };
  } = {};
  for (const e of errors) {
    const filePath = e.filePath;
    const error = e.error;
    errorMap[filePath] = {
      error
    };
  }
  return errorMap;
}

export function Editor(props: { disablelog?: boolean; disablepreview?: boolean; disablereload?: boolean; migrations: string; services: string; reloadstring: string; files: string; initialcurrent: string; classname?: string; errors: string }) {
  //console.dir(props);
  const logSocket = useLogSocket({
    disableLog: (props as any).disablelog === "true" || props.disablelog === true ? true : false
  });

  const [services, setservices] = jsx.useState<string[]>(JSON.parse(props.services));
  const [collapsed, setCollapsed] = jsx.useState<{
    [dir: string]: boolean
  }>((() => {
    const ret: { [dir: string]: boolean } = {};
    services.forEach(service => {
      ret[`${service}/`] = false;
    })
    return ret;
  })());

  /*const [panelVisible, setpanelVisible] = jsx.useState<{
    [panel: string]: boolean | undefined;
  }>({ right: false, bottom: false });*/

  const [rightPanelVisible, setRightPanelVisible] = jsx.useQuery("right-panel", "0");
  const [leftPanelVisible, setLeftPanelVisible] = jsx.useQuery("left-panel", "1");
  const [bottomPanelVisible, setBottomPanelVisible] = jsx.useQuery("bottom-panel", "0");

  const [migrations, setmigrations] = jsx.useState<string[]>(JSON.parse(props.migrations));
  const [files, setfiles] = jsx.useState(JSON.parse(props.files) as {
    filePath: string;
    language: string;
    previewPath?: string;
    dirs: string[];
    apiPreview?: {
      path: string;
      method: string;
    }[];
    content?: string;
    fileName: string;
  }[]);
  const [reloadString, setreloadString] = jsx.useState<string>(props.reloadstring);
  const [changed, setchanged] = jsx.useState<{
    [filePath: string]: string | null;
  }>({});
  const [errors, seterrors] = jsx.useState<{
    [filePath: string]: {
      error: string
    };
  }>(InflateError2Map(JSON.parse(props.errors)));
  const [newFileDialogShow, setnewFileDialogShow] = jsx.useState<boolean>(false);
  const [filter, setfilter] = useFilterQuery();

  const refresh = jsx.useRefresh();
  const [opened, setopened] = jsx.useState<{
    [filePath: string]: {
      filePath: string;
      fileName: string;
      language: string;
      previewPath?: string;
      apiPreview?: {
        path: string;
        method: string;
      }[];
      content: string | null;
      error?: {
        message: string;
      }
    }
  }>({});
  const [current, setcurrent] = jsx.useQuery("current", props.initialcurrent ? props.initialcurrent : "");
  const [_, setScroll] = useScroll();

  if (current instanceof Array) {
    setcurrent(current[0]);
  } else if (current) {
    if (!opened[current]) {
      const file = files.filter(file => file.filePath === current)[0];
      if (!file) {
        setcurrent("");
      } else {
        openFile(file.filePath);
      }
    }
  }

  /*useEffect(() => {
    for (const service of services) {
      if (collapsed[`${service}/`] === undefined) {
        collapsed[`${service}/`] = true;
        refresh();
      }
    }
  }, services);*/

  function openFile(filePath: string) {
    console.log("open [%s]", filePath);
    const isOpen = opened[filePath];
    setScroll({
      scrollLeft: 0,
      scrollTop: 0
    });
    if (!isOpen) {
      const file = files.filter(file => file.filePath === filePath)[0];
      if (!file) {
        throw new Error("cannot find reference to file [" + filePath + "]");
      }
      opened[file.filePath] = {
        content: null,
        ...file
      };
      changed[file.filePath] = null;

      setopened(opened);

      if (opened[file.filePath].content === null && (globalThis.window) !== undefined) {
        if (opened[file.filePath].language !== "binary") {
          fetch(BASEEDITOR_PATH + "/api/fs/read", {
            method: "POST",
            headers: {
              ["content-type"]: "application/json"
            },
            body: JSON.stringify({
              path: file.filePath
            })
          }).then(response => {

            if (response.ok) {
              response.json().then(json => {
                const contents = json.contents;
                if (opened[file.filePath]) {
                  opened[file.filePath].content = contents;
                  changed[file.filePath] = contents;
                  setopened(opened);
                  setchanged(changed);
                  refresh();
                }
              });
            }
          })
        } else {
          opened[file.filePath].content = "";
          changed[file.filePath] = "";
          setopened(opened);
          refresh();
        }
      }
    }
    setcurrent(filePath);
  }

  function closeFile(filePath: string) {
    setScroll({
      scrollTop: 0,
      scrollLeft: 0
    })
    console.log("closing [%s]", filePath);
    //console.log("current [%s]", current);
    if (filePath === current) {
      setcurrent("");
    }
    delete opened[filePath];
    delete changed[filePath];
    setchanged(changed);
    setopened(opened);
    refresh();
  }

  async function scanFiles() {
    const r = await fetch(BASEEDITOR_PATH + "/api/fs/scan", {
      method: "GET"
    });
    if (r.ok) {
      const { files, services } = await r.json();
      setfiles(files);
      setservices(services);
      for (const file of files) {
        if (opened[file.filePath]) {
          opened[file.filePath] = {
            content: opened[file.filePath].content,
            ...file
          };
        }
      }
    }
  }

  function isDirCollapsed(dir: string) {
    console.log("isDirCollapsed [%s]", dir);
    if (dir === "" || filter !== "") {
      return false;
    }
    return collapsed[dir] || collapsed[dir] === undefined ? true : false;
    //return collapsed[dir] ? false : true;
  }

  function toggleCollapseDir(dir: string) {
    console.log("toggleCollapseDir [%s]", dir);
    collapsed[dir] = isDirCollapsed(dir) ? false : true;
    setCollapsed(collapsed);
    refresh();
  }

  async function deleteFile(file: string) {
    console.log("deleteFile [%s]", file);
    const r = await fetch(BASEEDITOR_PATH + "/api/fs/delete", {
      method: "POST",
      headers: {
        ["content-type"]: "application/json"
      },
      body: JSON.stringify({
        path: file
      })
    });
    if (r.ok) {
      await scanFiles();
      if (opened[file]) {
        closeFile(file);
      }
    }
  }

  async function renameFile(file: string, newName: string) {
    console.log("renameFile [%s] to [%s]", file, newName);
    if (opened[file]) {
      const r = await fetch(BASEEDITOR_PATH + "/api/fs/rename", {
        method: "POST",
        headers: {
          ["content-type"]: "application/json"
        },
        body: JSON.stringify({
          path: file,
          newName
        })
      });
      if (r.ok) {
        const fileO = opened[file];
        const changeO = changed[file];
        fileO.filePath = newName;
        delete changed[file];
        delete opened[file];
        opened[newName] = fileO;
        changed[newName] = changeO;

        await scanFiles();

        setopened(opened);
        setchanged(changed);
        if (current === file) {
          setcurrent(newName);
        }
        refresh();
      }
    }
  }

  async function saveFile(file: string) {
    console.log("saveFile [%s]", file);
    const contents = changed[file];
    if (opened[file] && contents !== undefined && contents !== null) {
      const r = await fetch(BASEEDITOR_PATH + "/api/fs/write", {
        method: "POST",
        headers: {
          ["content-type"]: "application/json"
        },
        body: JSON.stringify({
          path: file,
          contents,
          override: true
        })
      });
      if (r.ok) {
        opened[file].content = contents;
        setopened(opened);
        setchanged(changed);
        refresh();
      }
    }
  }

  async function reloadServer() {
    const r = await fetch(BASEEDITOR_PATH + "/api/server/reload", {
      method: "POST"
    });
    if (r.ok) {
      const reloadResponse = await r.json();
      if (reloadResponse.errors && reloadResponse.errors.length > 0) {
        seterrors(InflateError2Map(reloadResponse.errors));
        setreloadString(reloadResponse.reloadString);
        refresh();
      } else {
        setreloadString(reloadResponse.reloadString);
        seterrors({});
        refresh();
      }
      setmigrations(reloadResponse.migrations);
      await scanFiles();
    }
  }

  function setLanguage(file: string, newLanguage: string) {
    if (opened[file]) {
      opened[file].language = newLanguage;
      setopened(opened);
      refresh();
    }
  }

  function hasFileContentChanged(filePath: string) {
    if (!opened[filePath]) {
      return false;
    }
    return changed[filePath] !== opened[filePath].content
  }

  function isPanelVisible(panel: string) {
    switch (panel) {
      case "left":
        return leftPanelVisible === "1";
      case "bottom":
        return bottomPanelVisible === "1";
      case "right":
        return rightPanelVisible === "1";
      default:
        return true;
    }
    //return panelVisible[panel] || panelVisible[panel] === undefined ? true : false;
  }

  function togglePanel(panel: string) {
    console.log("togglePanel [%s]", panel);
    /*panelVisible[panel] = !isPanelVisible(panel);
    setpanelVisible(panelVisible);
    refresh();*/
    switch (panel) {
      case "left":
        return setLeftPanelVisible(isPanelVisible(panel) ? "0" : "1");
      case "bottom":
        return setBottomPanelVisible(isPanelVisible(panel) ? "0" : "1");
      case "right":
        return setRightPanelVisible(isPanelVisible(panel) ? "0" : "1");
      default:
        return;
    }
  }

  const openedFile = opened[String(current)];

  //console.log("Editor [%s]", openedFile?.filePath);

  return <div class="editor">
    <div class={`editor-firstrow${!isPanelVisible("bottom") ? " bottom-panel-hidden" : ""}`}>
      <NewFile
        migrations={migrations}
        services={services}
        open={newFileDialogShow}
        ondone={async (path) => {
          setnewFileDialogShow(false);
          if (path) {
            await scanFiles();
            //await reloadServer();
          }
        }} />
      <FileBrowser
        disableLog={props.disablelog}
        disablePreview={props.disablepreview}
        disableReload={props.disablereload}
        togglePanel={togglePanel}
        isPanelVisible={isPanelVisible}
        opened={Object.keys(opened).sort().map(o => opened[o])}
        isDirCollapsed={isDirCollapsed}
        toggleCollapseDir={toggleCollapseDir}
        migrations={migrations}
        hasErrors={(file) => errors[file] ? true : false}
        reloadServer={reloadServer}
        closeAll={() => {
          const openedList = Object.keys(opened);
          for (const o of openedList) {
            closeFile(o);
          }
        }}
        closeFile={closeFile}
        current={current ? String(current) : ""}
        files={files}
        filter={filter}
        hasFileContentChanged={hasFileContentChanged}
        isOpen={(file) => opened[file] !== undefined}
        openFile={openFile}
        saveAll={async () => {
          const openedList = Object.keys(opened);
          for (const o of openedList) {
            if (hasFileContentChanged(o)) {
              await saveFile(o);
            }
          }
          //await reloadServer();
        }}
        scanFiles={scanFiles}
        setfilter={setfilter}
        showNewFile={() => {
          setnewFileDialogShow(true);
        }}
      />
      <div class={`file-editor-list${!isPanelVisible("left") ? " left-panel-hidden" : ""}${!isPanelVisible("bottom") ? " bottom-panel-hidden" : ""}`}>
        {!openedFile ?
          <StartPage
            disableLog={props.disablelog}
            disablePreview={props.disablepreview}
            disableReload={props.disablereload}
            isPanelVisible={isPanelVisible}
            togglePanel={togglePanel}
          /> :
          <div class="file-editor-container">
            <FileEditor
              disableLog={props.disablelog}
              disablePreview={props.disablepreview}
              disableReload={props.disablereload}
              isPanelVisible={isPanelVisible}
              togglePanel={togglePanel}
              reloadString={reloadString}
              error={errors[openedFile.filePath]?.error}
              changed={hasFileContentChanged(openedFile.filePath)}
              setlanguage={(newLanguage: string) => setLanguage(openedFile.filePath, newLanguage)}
              deleteFile={async () => {
                await deleteFile(openedFile.filePath);
                //await reloadServer();
              }}
              renameFile={async (newName) => {
                await renameFile(openedFile.filePath, newName);
                //await reloadServer();
              }}
              saveFile={async (reload = false) => {
                await saveFile(openedFile.filePath);
                if (reload) {
                  await reloadServer();
                }
                //
              }}
              content={changed[openedFile.filePath] !== null ? changed[openedFile.filePath] : opened[openedFile.filePath].content}
              current={current === openedFile.filePath}
              revertFile={() => {
                changed[openedFile.filePath] = openedFile.content;
                setchanged(changed);
                refresh();
              }}
              contentchange={(content) => {
                changed[openedFile.filePath] = content;
                setopened(opened);
                refresh();
              }}
              closeFile={() => {
                closeFile(openedFile.filePath);
              }}
              path={openedFile.filePath}
              previewPath={openedFile.previewPath}
              apiPreview={openedFile.apiPreview}
              language={opened[openedFile.filePath].language} />
          </div>}
      </div>
    </div>
    <div class="editor-bottom-panel" style={`${!isPanelVisible("bottom") ? "display: none;" : ""}`}>
      <LogViewer socket={logSocket} />
    </div>
  </div>
}

Editor.asFragment = true;
Editor.shadowInit = false;
