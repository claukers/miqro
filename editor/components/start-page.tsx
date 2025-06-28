import * as jsx from "@miqro/jsx";
import JSX from "@miqro/jsx";

interface StartPageProps {
  togglePanel: (panel: string) => void;
  isPanelVisible: (panel: string) => boolean;
  disableLog?: boolean; disablePreview?: boolean; disableReload?: boolean;
}

export function StartPage(props: StartPageProps) {

  jsx.useEffect(() => {
    if (!props.isPanelVisible("left")) {
      props.togglePanel("left");
    }
  }, []);

  return <div class={`start-page`}>
    <div class="row center">
      <h1>Start Page</h1>
    </div>
    <br />
    <div class="row center">
      <div class="row">
        <div class={`toggle-panel-button left-side-panel-button ${props.isPanelVisible("left") ? "active" : ""}`}
          onclick={ev => {
            ev.preventDefault();
            props.togglePanel("left");
          }}
        ></div>
        <br />
        {props.disableLog ? <></> : <div class={`toggle-panel-button bottom-side-panel-button ${props.isPanelVisible("bottom") ? "active" : ""}`}
          onclick={ev => {
            ev.preventDefault();
            props.togglePanel("bottom");
          }}
        ></div>}
        <br />
        {props.disablePreview ? <></> : <div class={`toggle-panel-button right-side-panel-button ${props.isPanelVisible("right") ? "active" : ""}`}
          onclick={ev => {
            ev.preventDefault();
            props.togglePanel("right");
          }}
        ></div>}
      </div>
    </div>
    <br />
  </div>;
}

StartPage.asFragment = true;
StartPage.shadowInit = false;
