import * as jsx from "@miqro/jsx";
import JSX from "@miqro/jsx";

import { APIPReview } from "./api-preview.js";
import { FileEditorToolbar } from "./file-editor-toolbar.js";
import { HighlightTextArea } from "./highlight-text-area.js";
import { useScroll } from "./scroll-query.js";

interface FileEditorProps {
  current: boolean;
  error: string;
  path: string;
  previewPath: string | undefined;
  apiPreview: undefined | {
    path: string;
    method: string;
  }[];
  content: string | null;
  contentchange: (content: string) => void;
  closeFile: () => void;
  saveFile: (reload?: boolean) => void;
  revertFile: () => void;
  deleteFile: () => void;
  renameFile: (newName) => void;
  setlanguage: (newLanguage) => void;
  language: string;
  changed: boolean;
  reloadString: string;
  togglePanel: (panel: string) => void;
  isPanelVisible: (panel: string) => boolean;
  disableLog?: boolean; disablePreview?: boolean; disableReload?: boolean;
}

export function FileEditor({ disableLog, disablePreview, disableReload, togglePanel, isPanelVisible, apiPreview, reloadString, error, revertFile, changed, setlanguage, saveFile, deleteFile, renameFile, current, path, previewPath, content, contentchange, closeFile, language }: FileEditorProps) {
  //console.log("FileEditor [%s]", path);
  const iFrameRef = jsx.useRef();
  const scrollRef = jsx.useRef();
  const [scroll, setScroll] = useScroll();

  jsx.useEffect(() => {
    if (scrollRef.current) {
      (scrollRef.current as any).scrollLeft = scroll.scrollLeft;
      (scrollRef.current as any).scrollTop = scroll.scrollTop;
    }
  }, [scrollRef.current]);

  jsx.useEffect(() => {
    if (current && scrollRef.current) {
      setScroll({
        scrollLeft: (scrollRef.current as any).scrollLeft,
        scrollTop: (scrollRef.current as any).scrollTop
      }, true);
    }
  }, [current]);

  jsx.useEffect(() => {
    if (iFrameRef.current) {
      (iFrameRef.current as any).src = "";
      (iFrameRef.current as any).src = previewPath;
    }
  }, [iFrameRef.current, previewPath, reloadString]);

  return <div class="file-editor">
    {content === null ? <p>loading</p> : <>
      <FileEditorToolbar
        disableLog={disableLog}
        disablePreview={disablePreview}
        disableReload={disableReload}
        isPanelVisible={isPanelVisible}
        togglePanel={togglePanel}
        revertFile={revertFile}
        closeFile={closeFile}
        language={language}
        path={path}
        changed={changed}
        saveFile={saveFile}
        setlanguage={setlanguage}
        deleteFile={deleteFile}
        renameFile={renameFile} />
      <div
        //class={`file-editor-content${previewPath || apiPreview ? " split" : ""}`}
        class="file-editor-content">
        <div ref={scrollRef}
          class={`file-editor-text-editor${previewPath || (apiPreview && apiPreview.length > 0) && isPanelVisible("right") ? " split" : ""}`}
          //class={`file-editor-text-editor`}
          onscroll={ev => {
            setScroll({
              scrollLeft: ev.target.scrollLeft,
              scrollTop: ev.target.scrollTop
            });
          }}>
          {error ?
            <p class="file-editor-content-error">{error}</p>
            : <></>}
          {language !== "binary" ?
            <HighlightTextArea
              tabChar="  "
              oncontentchange={(args: CustomEvent) => {
                if (contentchange) {
                  contentchange(args.detail);
                }
              }}
              content={content}
              language={language} /> : <p>binary data not supported</p>
          }
        </div>
        {apiPreview && apiPreview.length > 0 ? <APIPReview
          isPanelVisible={isPanelVisible}
          apiPreview={apiPreview} /> : <></>}
        {previewPath && isPanelVisible("right") ? <div
          class={`file-editor-preview`}
          style={`${!isPanelVisible("right") ? "display: none;" : ""}`}>
          <div class="file-editor-preview-path"><a href={previewPath} target="_blank">open in new window</a></div>
          <iframe
            ref={iFrameRef}
            src={previewPath} sandbox="allow-scripts allow-same-origin"></iframe>
        </div> : <></>}
      </div>
    </>}
  </div>
}

FileEditor.asFragment = true;
FileEditor.shadowInit = false;

