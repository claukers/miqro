export const TEMPLATES: {
  [name: string]: {
    displayName: string;
    template?: ((filename: string, httpPath: string) => string);
    httpSufix?: string;
    sufix?: string;
    prefix?: string;
    language: string;
    filename?: string;
  }
} = {
  EMPTY: {
    displayName: "empty file",
    //template: () => "",
    sufix: "",
    language: "text",
    prefix: ""
  },
  JSON: {
    displayName: "a .json.ts file",
    template: () => `import { ServerRequest, ServerResponse } from "miqro";

export default async (req: ServerRequest | null, res: ServerResponse | null) => {
  return {
    count: 1
  }
}`,
    sufix: ".json.ts",
    language: "typescript",
    prefix: ""
  },
  API: {
    prefix: "http",
    sufix: ".api.ts",
    displayName: ".api.ts file",
    language: "typescript",
    template: () => `import { ServerRequest, ServerResponse, APIRoute } from "miqro";

export default {
  path: "/health",
  description: "checks the health of the service",
  method: "GET",
  //middleware: [server.middleware.json()],
  request: {
    /*body: {
      someAttr: "string",
      optionalArray: "number[]?"
    }*/
  },
  response: {
    status: [200, 400],
    body: {
      status: {
        type: "enum",
        enumValues: ["OK", "NOK"]
      },
      message: "string?"
    }
  },
  handler: async (req: ServerRequest, res: ServerResponse) => {
    try {
      const [{ c }] = await req?.server?.db?.get("MyDB")?.query("SELECT 1+1 as c") as [{ c: number }];
      const statusText = String(c) === "2" ? "OK" : "NOK";
      return {
        status: statusText === "OK" ? 200 : 400,
        body: {
          status: statusText
        }
      }
    } catch (e) {
      req.logger.error(e);
      return {
        status: 400,
        body: {
          status: "NOK",
          message: e.message
        }
      };
    }
  }
} as APIRoute`
  },
  MIGRATION: {
    prefix: "migration",
    sufix: ".ts",
    displayName: "migration file",
    language: "typescript",
    template: () => `import { Migration } from "miqro";

export default {
    up: async (db, logger) => {
        await db.createTable("mytable", {
            id: {
                type: "bigint",
                autoIncrement: true,
                primaryKey: true
            },
            name: {
                type: "string"
            }
        }).yield(logger);
    },
    down: async (db, logger) => {
        await db.dropTable("mytable").yield(logger);
    }
} as Migration;`
  },
  TEST: {
    prefix: "test",
    sufix: ".test.tsx",
    displayName: "a test file",
    language: "typescript",
    template: () => `import { } from "miqro";
import { strictEqual } from "node:assert";

describe("test group", () => {
  it("sample test1", async () => {
    const response = await test.request({
      url: "/index.html"
    });
    strictEqual(response.status, 200);
  });

  it("sample test2", async () => {
    await test.jsx.test(async (container, root, runtime) => {
      function SomeComponent() {
        return <p id="test-id">HelloWorld</p>
      }
      container.render(<SomeComponent />);
      strictEqual(runtime.getElementById("test-id")?.textContent, "HelloWorld");
    });
  });
});
`
  },
  HTMLTSX: {
    prefix: "http",
    sufix: ".html.tsx",
    displayName: ".html.tsx file",
    language: "typescript",
    template: () => `import { ServerRequest, ServerResponse, APIOptions } from "miqro";

/*export const apiOptions: APIOptions = {
  path: ["/", "/index.html"],
  method: ["GET"]
};*/

export default async (req: ServerRequest | null, res: ServerResponse | null) => {
  return <html>
    <head></head>
    <body>
      <h1>hello world!</h1>
    </body>
  </html>;
}`
  },
  AUTHCONFIG: {
    prefix: "",
    sufix: ".ts",
    filename: "auth",
    displayName: "auth.ts file",
    language: "typescript",
    template: () => `import { AuthConfig } from "miqro";

export default {
  //path: ["/api/"], //optionaly specify a custom path list
  /*options: {
    tokenLocation: "free",// "query"//"cookie" //"header"
    tokenLocationName: "x-auth"
  },*/
  authService: {
    verify: async ({ token, req, res }) => {
      // TODO Implement logic
      return null;
      /*return {
        username: "username",
        groups: ["someapi"],
        account: "account",
        token: ""
      };*/
    }
  }
} as AuthConfig;
`
  },
  DOCCONFIG: {
    prefix: "",
    sufix: ".ts",
    filename: "doc",
    displayName: "doc.ts file",
    language: "typescript",
    template: () => `import { DocConfig } from "miqro";

export default {
  // auto publish API documentation
  publish: {
    "/api/doc.html": {
      type: "HTML", // can be "MD" | "JSON" | "HTML"
      //all: true, // enable to show .html and other static resources
    }
  }
} as DocConfig;`
  },
  WSCONFIG: {
    prefix: "",
    sufix: ".ts",
    filename: "ws",
    displayName: "ws.ts file",
    language: "typescript",
    template: () => `import { WSConfig } from "miqro";

export default { 
  path: "/socket",
  //disabled: true,
  //maxConnections: 100,
  /*onConnection(req) {
    
  },*/
  /*onDisconnect: (req) => {

  },*/
  /*onError: (req, error) => {

  },*/
  /*onMessage: (req, data) => {

  },*/
  validate(req) {
    // TODO implement logic
    return false;
  },
} as WSConfig;
`
  },
  SERVERCONFIG: {
    prefix: "",
    sufix: ".ts",
    filename: "server",
    displayName: "server.ts file",
    language: "typescript",
    template: () => `import { ServerConfig } from "miqro";

export default {
  preload: async (server) => {
    server.logger.info("server preload");
    /* uncomment code below to migrate-up the database "MyDB" before loading */
    /*if (server?.isPrimaryWorker()) {
      await server.db.migrate({ direction: "up", dbName: "MyDB" });
    }*/
  },
  load: async (server) => {
    server.logger.info("server loaded");
  },
  start: async (server) => {
    server.logger.info("server started");
    if (server.isPrimaryWorker()) {
      try {
        server.openBrowser("/index.html");
      } catch (e) {
        server.logger.error(e.message);
      }
    }
  },
  unload: (server) => {
    server.logger.info("server unload");
  },
  stop: (server) => {
    server.logger.info("server stop");
  }
} as ServerConfig;
`},
  TSCONFIGJSON: {
    prefix: "",
    sufix: ".json",
    filename: "tsconfig",
    displayName: "tsconfig.json file",
    language: "json",
    template: () => `{
  "compilerOptions": {
    "target": "es2022",
    "noEmit": true,
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "lib": ["es2021", "dom"],
    "jsx": "react",
    "jsxFactory": "JSX.createElement",
    "jsxFragmentFactory": "JSX.Fragment",
    "typeRoots": [
      "./.types"
    ]
  }
}
`},
  MIQROJSON: {
    prefix: "",
    sufix: ".json",
    filename: "miqro",
    displayName: "miqro.json file",
    language: "json",
    template: () => `{
  "services": ["src/"],
  "inflateDir": "build/",
  "name": "server",
  "browser": true,
  "logFile": false,
  "port": "3000"
}
`},
  MINIFIEDJSX: {
    prefix: "http",
    sufix: ".min.tsx",
    displayName: "min.tsx file",
    language: "typescript",
    template: () => `import { } from "miqro";

export function MyComponent() {
  return <p>HelloWorld</p>
}
window.addEventListener("load", (event) => {
  jsx.define("my-tag", MyComponent, {
    shadowInit: false,
    observedAttributes: []
  });
});  
`},
  JSX: {
    prefix: "http",
    sufix: ".tsx",
    displayName: ".tsx file",
    language: "typescript",
    template: () => `import { } from "miqro";

export function MyComponent() {
  return <p>HelloWorld</p>
}
window.addEventListener("load", (event) => {
  jsx.define("my-tag", MyComponent, {
    shadowInit: false,
    observedAttributes: []
  });
});  
`},
  SSRTSX: {
    prefix: "http",
    sufix: ".tsx",
    displayName: "an ssr component example using webcomponents",
    language: "typescript",
    httpSufix: ".js",
    template: (_filename: string, httpPath: string) => `import { } from "miqro";

// TODO change this accordingly
const TAG = "my-tag";

function MyComponent(props, children) {
  const [count, setcount] = jsx.useState(0);
  jsx.useEffect(()=>{
    const timeout = setTimeout(()=>{
      setcount(count+1);
    }, 1000);
    return ()=>{
      clearTimeout(timeout);
    }
  });
  return <p>Count: {count}</p>
}

window.addEventListener("load", (event) => {
  jsx.define(TAG, MyComponent, {
    shadowInit: false,
    observedAttributes: []
  });
});

export function SSRComponent(props, children) {
  return JSX.createElement(
    JSX.Fragment, null, 
      JSX.createElement(TAG, props, 
        JSX.createElement(MyComponent, props, ...children)
      ), 
      JSX.createElement("script", { type: "module", src: "/${httpPath}" }) 
    );
}
`
  },
  SSRMINTSX: {
    prefix: "http",
    sufix: ".min.tsx",
    displayName: "a minified ssr component example using webcomponents",
    language: "typescript",
    httpSufix: ".min.js",
    template: (filename: string, httpPath: string) => `import { } from "miqro";

// TODO change this accordingly
const TAG = "my-tag";

function MyComponent(props, children) {
  const [count, setcount] = jsx.useState(0);
  jsx.useEffect(()=>{
    const timeout = setTimeout(()=>{
      setcount(count+1);
    }, 1000);
    return ()=>{
      clearTimeout(timeout);
    }
  });
  return <p>Count: {count}</p>
}

window.addEventListener("load", (event) => {
  jsx.define(TAG, MyComponent, {
    shadowInit: false,
    observedAttributes: []
  });
});

export function SSRComponent(props, children) {
  return JSX.createElement(
    JSX.Fragment, null, 
      JSX.createElement(TAG, props, 
        JSX.createElement(MyComponent, props, ...children)
      ), 
      JSX.createElement("script", { type: "module", src: "/${httpPath}" }) 
    );
}
`
  },
  JS: {
    prefix: "http",
    sufix: ".js",
    displayName: ".js file",
    language: "typescript",
    template: () => `window.addEventListener("load", (event) => {
  
});  
`},
  CSS: {
    prefix: "http",
    sufix: ".css",
    displayName: ".css file",
    language: "css",
    template: () => `* {
  font-family: "Menlo" !important;
  font-size: 11px;
}  
`
  },
  DBCONFIG: {
    prefix: "",
    filename: "db",
    sufix: ".ts",
    displayName: "db.ts file",
    language: "typescript",
    template: () => `import { DBConfig } from "miqro";

export default {
  //dialect: "node:sqlite"
  //storage: "./db.sqlite3"
  //url: "..."
  //disabled: false,
  name: "MyDB"
} as DBConfig`
  },
  CORS: {
    prefix: "",
    filename: "cors",
    sufix: ".ts",
    displayName: "cors.ts file",
    language: "typescript",
    template: () => `import { CORSConfig } from "miqro";

export default {
  origins: "*",
  /*validate: (origin: string, origins: string | string[]) => {
    return false
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false*/
} as CORSConfig;
`
  }
}
