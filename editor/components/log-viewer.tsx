import * as jsx from "@miqro/jsx";
import JSX from "@miqro/jsx";

import { LogSocket } from "../common/log-socket.js";

function getUniqueIdentifiers(lines: {
  out: string;
  identifier: string;
}[]) {
  const identifiersCache = {};
  return lines.map(l => l.identifier).filter(identifier => {
    const filter = !identifiersCache[identifier];
    identifiersCache[identifier] = true;
    return filter;
  });
}

const LOG_LEVEL_MAP =
{
  "none": 0,
  "error": 1,
  "warn": 2,
  "info": 3,
  "debug": 4,
  "trace": 5,
};

interface LogViewerProps {
  socket: LogSocket;
}

export function LogViewer(props: LogViewerProps) {
  const { lines, clearLog, getMaxlogsize, setMaxLogSize } = props.socket;

  const maxLogSize = getMaxlogsize();

  const refresh = jsx.useRefresh();

  jsx.useEffect(() => {
    refresh();
  }, [maxLogSize]);

  const [identifier, setidentifier] = jsx.useState<string>("");
  const [level, setlevel] = jsx.useState<string>("debug");
  const [filter, setfilter] = jsx.useState<string>("");
  const identifiers = getUniqueIdentifiers(lines).sort();
  //console.log(identifiers);

  return <div class="log-viewer">
    <div class="log-viewer-toolbar">
      <button
        class="btn"
        onclick={e => {
          e.preventDefault();
          clearLog();
        }}>clear log</button>
      <select
        value={maxLogSize}
        oninput={ev => {
          ev.preventDefault();
          if (ev.target.value === "unlimited") {
            setMaxLogSize("unlimited");
          } else {
            setMaxLogSize(parseInt(ev.target.value, 10));
          }
        }}
        style="margin: 0; padding: 0; margin-left:auto; margin-right: 0;">
        {["10", "1000", "5000", "10000", "15000", "20000", "25000", "50000", "100000", "500000", "1000000", "1500000", "5000000"].map(l => <option value={l}>{l}</option>)}
        <option value="unlimited">unlimited</option>
      </select>
      <select
        value={level}
        oninput={ev => {
          ev.preventDefault();
          setlevel(ev.target.value);
        }}
        style="margin: 0; padding: 0; margin-left:var(--file-browser-separation); margin-right: 0;">
        {["error", "warn", "info", "debug", "trace"].map(l => <option value={l}>{l}</option>)}
        <option value="">all</option>
      </select>
      <select
        value={identifier}
        oninput={ev => {
          ev.preventDefault();
          setidentifier(ev.target.value);
        }}
        style="margin: 0; padding: 0; margin-left:var(--file-browser-separation); margin-right: 0;">
        {identifiers.map(identifier => <option value={identifier}>{identifier}</option>)}
        <option value=""></option>
      </select>
      <input
        style="margin: 0; padding: 0; margin-left:var(--file-browser-separation); margin-right: 0;"
        value={filter}
        oninput={ev => {
          ev.preventDefault();
          setfilter(ev.target.value);
        }}
        type="text"
        placeholder="..filter.." />
    </div>
    <div class="log-viewer-log">
      {lines
        .filter(line => identifier === "" || line.identifier === identifier)
        .filter(line => filter === "" || line.out.indexOf(filter) !== -1)
        .filter(line => {
          return (level === "" || LOG_LEVEL_MAP[level] >= LOG_LEVEL_MAP[line.level]);
        })
        .map(line =>
          <p style="margin: 0; padding: 0; border-radius: 0; font-size: 12px;" class={line.level === "error" ? "info-danger" : line.level === "warn" ? "info-warn" : line.level === "trace" ? "info-success" : line.level === "debug" ? "info-info" : ""}>{line.out}</p>
        ).reverse()}
    </div>
  </div>
}
