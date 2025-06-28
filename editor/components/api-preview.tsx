import { HighlightTextArea } from "./highlight-text-area.js";
import * as jsx from "@miqro/jsx";
import JSX from "@miqro/jsx";

const DEFAULT_HEADERS = `{"content-type": "application/json"}`;
const DEFAULT_BODY = `{}`;

export function APIPReview(props: {
  apiPreview?: {
    path: string;
    method: string;
  }[];
  isPanelVisible: (panel: string) => boolean;
}) {
  const pathRef = jsx.useRef();
  const methodRef = jsx.useRef();
  const headersRef = jsx.useRef();
  const bodyRef = jsx.useRef();
  const [headers, setHeaders] = jsx.useState<string>(DEFAULT_HEADERS);
  const [body, setBody] = jsx.useState<string>(DEFAULT_BODY);

  const [responseStatus, setresponseStatus] = jsx.useState<null | number>(null);
  const [responseHeaders, setresponseHeaders] = jsx.useState<null | string>(null);
  const [responseBody, setresponseBody] = jsx.useState<null | string>(null);

  const { path, method } = props.apiPreview ? props.apiPreview[0] : { path: "", method: "" };

  jsx.useEffect(() => {
    setresponseStatus(null);
    setresponseHeaders(null);
    setresponseBody(null);
    /*setHeaders(DEFAULT_HEADERS);
    setBody(DEFAULT_BODY);*/
  }, [path]);

  const useBody = String(method).toLocaleLowerCase() !== "get";

  function submit() {
    try {
      if (methodRef.current && pathRef.current && headersRef.current) {
        setHeaders(headersRef.current.value);
        if (bodyRef.current) {
          setBody(bodyRef.current.value);
        }
        fetch(pathRef.current.value, useBody && bodyRef.current ? {
          method: methodRef.current.value,
          headers: JSON.parse(headersRef.current.value),
          body: bodyRef.current.value
        } : {
          method: methodRef.current.value,
          headers: JSON.parse(headersRef.current.value),
        }).then(async (r) => {
          setresponseStatus(r.status);
          const headers = {};
          r.headers.forEach((value, key) => {
            headers[key] = value;
          });
          setresponseHeaders(JSON.stringify(headers, undefined, 2));
          const text = await r.text();
          setresponseBody(text);
          try {
            setresponseBody(JSON.stringify(JSON.parse(text), undefined, 2));
          } catch (e) {
            // ignore
          }
        }).catch(e => {
          console.error(e);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  return <div
    style={`${!props.isPanelVisible("right") ? "display: none;" : ""}${props.apiPreview ? "" : " display: none; "}margin:0; padding: 0; overflow: auto; max-height: 100%; width:100%;`}>
    <form
      onsubmit={ev => {
        ev.preventDefault();
        submit();
      }}>
      <p>path</p>
      <input style="width: calc(100% - 4 * var(--file-browser-separation));" type="text" value={path} ref={pathRef} />
      <p>method</p>
      <input style="width: calc(100% - 4 * var(--file-browser-separation));" type="text" value={method} ref={methodRef} />
      <p>headers</p>
      <input style="width: calc(100% - 4 * var(--file-browser-separation));" type="text" value={headers} ref={headersRef} />
      {useBody ?
        <>
          <p>body</p>
          <input style="width: calc(100% - 4 * var(--file-browser-separation));" type="text" value={body} ref={bodyRef} />
        </> :
        <></>}
      <button style="margin-top: var(--file-browser-separation); width: 100%;" class="btn"
        onclick={ev => {
          ev.preventDefault();
          submit();
        }}>submit</button>
      <div>
        <p>response status</p>
        <p>{responseStatus}</p>
        <p>response headers</p>
        <HighlightTextArea
          content={responseHeaders ? responseHeaders : "null"}
          language={"json"}
          disabled="true" />
        <p>response body</p>
        <HighlightTextArea
          content={responseBody ? responseBody : "null"}
          language={"json"}
          disabled="true" />
      </div>
    </form>
  </div>;
}

APIPReview.asFragment = true;
APIPReview.shadowInit = false;
