interface LogLine { out: string; identifier: string; level: "error" | "warn" | "debug" | "trace" | "info" }

export interface LogSocket {
  lines: LogLine[];
  clearLog: () => void;
  getMaxlogsize: () => number | "unlimited";
  setMaxLogSize: (val: number | "unlimited") => void;
}

export function useLogSocket(options: { disableLog?: boolean; }): LogSocket {

  const [_, setmaxLogSize, getMaxlogsize] = jsx.useState<number | "unlimited">(1000000);

  const [__, setlines, getLines] = jsx.useState<LogLine[]>([]);
  const refresh = jsx.useRefresh();

  jsx.useEffect(() => {

    let timeout;

    function setupSocket() {
      try {
        if (options.disableLog) {
          return;
        }
        console.log("setting up log socket");
        const socket = new WebSocket("/admin/socket");
        socket.addEventListener("error", (err) => {
          console.error(err);
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            setupSocket();
          }, 1000);
        });
        socket.addEventListener("open", () => {
          console.log("log socket open");
          clearTimeout(timeout);
          socket.addEventListener("message", (msg) => {
            const lines = getLines();
            const data = JSON.parse(msg.data);
            //console.log(data.out);
            const maxLogSize = getMaxlogsize();
            if (maxLogSize !== "unlimited" && lines.length >= maxLogSize) {
              lines.splice(0, (lines.length - maxLogSize) + 1);
            }
            lines.push(data);
            setlines(lines);
            refresh();
          });
        });
        socket.addEventListener("close", () => {
          console.log("log socket close");
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            setupSocket();
          }, 1000);
        });
      } catch (e) {
        console.error(e);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setupSocket();
        }, 1000);
      }
    }

    setupSocket();
  }, []);

  return {
    lines: getLines(),
    clearLog: () => {
      setlines([]);
    },
    getMaxlogsize,
    setMaxLogSize: (newValue: number | "unlimited") => {
      if (newValue === "unlimited") {
        setmaxLogSize(newValue);
      } else {
        setmaxLogSize(newValue);
      }

    }
  }
}
