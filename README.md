# miqro

**experimental** development cli for **static web site generation** using JSX.

it uses ```esbuild``` for faster transpilation.

but also can

- can create **javascript native** ```WebComponents``` using ```JSX``` with ```@miqro/jsx```.

- can transform ```markdown``` to **html** using ```showdown```.

- can also host custom **API** endpoints with a complete web framework if more than a static web site generator is needed.

- can provide a database connection to ```sqlite3```, ```postgres``` and ```sql server``` using ```@miqro/query```. by default it uses the native ```node:sqlite3``` **experimental** module for ```Node.js >=20.x``` but can also use ```sqlite3```, ```pg``` and others.

- can manage **database migrations** for your **app** or **static site** build using a database as source.

- provide built-in ```editor``` for **development** using ```highlight.js``` for **code highlight**.

- can run generate **API documentation** using **markdown** or **json**.

- can run **tests** on your **app** or **static site**.

- can be installed and run **without Node.js** installed as a standalone ```NODE:SEA``` binary for ```linux-x64```, ```linux-arm64```, ```darwin-x64``` and ```darwin-arm64```.

- can create a standalone ```NODE:SEA``` ```binary``` of your webapp for ```linux-x64```, ```linux-arm64```, ```darwin-x64``` and ```darwin-arm64```.

## installation

### without Node.js installed as a NODE:SEA binary.

download the standalone binary from the [releases](https://github.com/claukers/miqro/releases) page.

### npm dependency for Node.js project

or use it as a dependecy on your Node.js project.

```npm install miqro```

## getting started basic example static site generated with jsx

project structure

```
example/
  http/
    about/
      ...
    index.html.tsx
  static/
    ...
```

### 1. create an empty folder to contain the example service and files

```mkdir -p example/http```

### 2. create a basic ```.html.tsx``` file.

```example/http/index.html.tsx```

```typescript
import JSX from "@miqro/jsx";

export default (req, res) => {
  return <html>
    <body>
      <h1>Hello World!</h1>
    </body>
  </html>
}
```

to host a watch server with the example run the following command.

```miqro --watch --service example/```

then open a browser and go to ```http://localhost:8080/index.html``` to watch the changes you make into the file.

### 3. generate static files to host with a web server

to generate the static files just run the command.

```miqro --inflate --inflate-dir build/ --service example/```

the generated static files will be written in ```build/example/http/static````

and can be served like this.

```python3 -m http.server 8080 build/example/http/static```


## Documentation

### usage as a module

first install as a dependency

```npm install miqro --save```

example loading the service created in the getting started above.

```typescript
import { Miqro } from "miqro";

const app = new Miqro({
  services: ["example/"],
  //name: "SOME NAME", // if running inside node:cluster worker you MUST set this value to allow worker syncronization
  //port: "3000",
  //hotreload: false,
  //editor: false,
  //editor: false,
});
// to inflate to a dir
await app.inflate({
  inflateDir: "build/";
  inflateSea: false;
});
// or to inflate to memory
// await app.inflate();
// to start the server
// await app.start();
// to stop the server
// await app.stop();
// to dispose the server and disconnect all node:cluster worker syncronization for safe exiting
// await app.dispose();
```

### usage as cli

#### inflate static files with the cli

```miqro --service example/ --inflate --inflate-dir build/```

#### watch and reload server to see the changes to the files in real-time

```miqro --watch --service example/```

#### start multiple services

```miqro --service example/ --service api/```

#### start multiple services in a node:cluster

```npx miqro-cluster --service example/ --service api/```

## basic service folder structure

```
app/
  http/
    ...
  static/
    ...
  migration/
    ...
  test/
    ....
  db.ts
  ws.ts
  auth.ts
  server.ts
```

all files and folders are ***optional***.

to start the development server run

```miqro --service app/```

and with the included editor

```miqro --service app/ --editor```

### http folder

the http folder will be recursivly scan for files to serve.
the files will be server acording to the location in the directory. 

for example.

```
http/
  index.html.tsx
  css/
    style.css
  js/
    script.min.js
```

this will create the routes

1. /index.html
2. /css/style.css
3. /js/script.min.js

#### .html.tsx

a file with the extension ```.html.tsx``` will be rendered as an html created by a JSX expression. for example.

```ìndex.html.tsx```
```tsx
import { MyComponent } from "./component.js";

export default <html>
  <body>
    <MyComponent />
  </body>
</html>
```

you can also export a request function and customize the route by exporting a ```apiOptions``` object.

```ìndex.html.tsx```
```tsx
import JSX from "@miqro/jsx";
import { ServerRequest, ServerResponse, APIOptions } from "miqro";
import { MyComponent } from "./component.js";

// export the object apiOptions to customize the paths and methods
export const apiOptions: APIOptions = {
  path: ["/", "/index.html"],
  method: ["GET", "POST"]
};

export default (req: ServerRequest, res: ServerResponse) => {
  return <html>
    <body>
      <MyComponent />
    </body>
  </html>
}
```

#### .min.tsx

a file with the extension ```.min.tsx``` will be rendered as a **minified** javascript script that bundles the ```@miqro/jsx``` module.

to avoid minification just use the ```.tsx``` extension inside the ```http``` folder.

example defining a ```WebComponent``` with ```JSX``` using ```@miqro/jsx```.

```script.min.tsx```
```typescript
import JSX, { useState, useEffect } from "@miqro/jsx";
import { define } from "@miqro/jsx-dom";
/*
basic dynamic component example
*/
export function TickerComponent() {
  // create a state variable count
  const [count, setCount] = useState(0);
  // create a effect with a setTimeout that updates count after 1000ms
  useEffect(() => {
    // create the timeout
    const timeout = setTimeout(() => {
      setCount(count + 1);
    }, 1000);
    // return a clean up function to clear the timeout if it's running when the component is removed from the DOM.
    return () => {
      // clear the timeout if the effect is canceled.
      clearTimeout(timeout);
    }
  }, [count]);
  // return the jsx to be rendered
  return <p>Count: {count}</p>;
}

window.addEventListener("load", async (event) => {
  /* this will define a custom element called ticker-tag with the tag
  
  <ticker-tag></ticker-tag>

  as a standard web component.

  just include this script in the page with a script tag like 
  <script src="..."></script>
  
  */
  define("ticker-tag", TickerComponent, {
    shadowInit: false, // or { mode: "closed" | "closed" }
    //extends: "p";
    //observedAttributes: ["width", "height", "some-attr"]; // attribues that are observed for changes to re-render the JSX component
  });
});
```

#### .api.ts

a file with the extension ```.api.ts``` will be use as a custom REST API endpoint.

for example

```/posts/post.api.tsx```
```typescript
export default (req, res) => {
  return res.json({
    someValue: 1
  });
}
```

to costumize the route and middleware used and parse the request input before your function use export an ```APIRoute```object. 
this example uses the ```server.middleware.json()``` to parse the request body as a json.

```/posts/post.api.tsx```
```typescript
import { ServerRequest, ServerResponse } from "miqro";
import { APIRoute } from "@miqro/core";

export default {
  name: "post api",
  description: "to do posts", 
  path: ["/", "/do"],
  method: ["POST"],
  middleware: [server.middleware.json()],
  request: {
    headers: {
      auth: "string"
    },
    query: {
      pagination: "number"
    },
    body: {
      inputValue: "string"
      otherInputValues: "number[]?"
    }
  },
  response: {
    status: [200, 400],
    body: {
      someValue: "number"
    }
  }
  handler: (req: ServerRequest, res: ServerResponse) => {
    // with req?.server?.db.get(..)? you can query the database MyDB if it's configured with a db.ts file
    // const rows = await req?.server?.db.get("MyDB")?.select().from("....
    return res.json({
        someValue: 1
    });
  }
} as APIRoute;
```

```req.server```

all request's have a property called ```server``` that it can be used to access server shared content. 

this is necesary because every ```service``` file is imported ```isolated``` from the others using  an ```esbuild``` ```bundle``` to **force state-less coding**.

```ServerRequest```

```typescript
import { Request } from "@miqro/core";

interface ServerRequest extends Request {
  server?: {
    // null values are if the feature has been disabled
    // database connections interface
    db: {
      get(name: string): Database | null;
      getMigrations(): NamedMigration[];
      migrate(options: MigrateOptions): Promise<void>;
    },
    // websocket server interface
    ws: {
      get(path: string): WebSocketServer | undefined;
      disconnectAll(path: string): void;
    };
    cache: CacheInterface; // this cache will be syncronized between all node:cluster workers
    localCache: CacheInterface; // this cache will local to the node:cluster worker
    logger?: Logger;
    isPrimaryWorker: () => boolean;
    openBrowser: (path: string) => void;
    getLogger: (identifier: string, options?: { level?: any; transports?: any[]; formatter?: any; }) => Logger;
  };
}
```

example using ```req.server``` to access a key in the node:cluster synced cache.

```typescript
import { ServerRequest, ServerResponse } from "miqro";

export default (req: ServerRequest, res: ServerResponse) => {
  const value = req?.cache?.get("some_key");
  // req?.cache?.set("some_key", "value");
  return {
    status: 200,
    body: {
      some_key: value
    }
  }
}
```

#### .html.md

TODO

#### .min.js

TODO

#### .bundle.js

TODO

#### .css.bundle

TODO

### static folder

the static folder will act the same as the http folder but will treath every file **as is**.

the files will be server acording to the location in the directory. 

for example.

```
static/
  index.html
  css/
    style.css
  js/
    script.min.js
```

this will create the routes

1. /index.html
2. /css/style.css
3. /js/script.min.js

### migration folder

TODO

### test folder

TODO

### db.ts

TODO

### ws.ts

TODO

### auth.ts

TODO

### server.ts

TODO

### log.ts

TODO

### middleware.ts

TODO

### catch.ts

TODO

### miqro.json

TODO

### Globals

TODO

#### test global

TODO

## static web site generator

you can also inflate your project to avoid rendering ```http/**/*.html.tsx``` and other files per request. this can be done pre-rendereding with the ```--inflate``` flag.

```miqro --service app/ --inflate --inflate-dir build/```

this will create the ```build/``` folder with the inflated app static files.

you can host only the generated static ```*.html.tsx``` files with other http servers.

```python3 -m http.server 8080 build/app/static/```

## cluster

for this you will need to install miqro as a dependency of your project.

```npm install miqro --save```

```npx miqro-cluster --service app/```

this will launch your app in a cluster mode. 

to change the number of nodes use ```CLUSTER_COUNT=10```for example to set the count to 10 nodes.

```CLUSTER_COUNT=10 npx miqro-cluster --service app/```

## Using TSC or another transpiler insted of esbuild on runtime

```miqro --no-build ...```

for this to work you will need to run ```tsc``` or another transpiler to transform your JSX files.

## cli usage

### start a project

```miqro --service app/```

by default the project will be hosted on ```http://localhost:8080```.

start with hot-reload disabled

```miqro --watch --service app/```

start on custom port

```PORT=8181 miqro app/```

### run migrations on the project

TODO

### run the project tests

TODO

### generate API documentation

TODO

### inflate project or eject from miqro

to inflate all http files into static files use the ```--inflate``` with the ```--inflate-dir``` arguments.

```miqro --inflate --inflate-dir build/ --service app/```

this will render the ```.html.tsx``` and other files in the ```http/``` folder and the ```static/``` folder into the ```build``` folder for static serving.

for example.

```
miqro --inflate --inflate-dir build/ --service app/
cd build/
python3 -m http.server 8080
```

### more cli usages

```miqro --help```

```
usage: miqro [...FLAGS] --service app/

==examples==

miqro --watch --service front/
PORT=8181 miqro --service api/ --service front/
miqro --test --service front/
miqro --inflate --service front/
miqro --generate-doc --generate-doc-out API.md --service front/
CLUSTER_COUNT=10 miqro-cluster --service api/

==flags==

-v, --version
        outputs the version number
-h, --help
        outputs this page.
--watch
        use to auto reload the server when files change.
--hot-reload
        enables the hot-reload functionality use with --watch.
--test
        run the tests for a service.
--migrate-up
        migrations up.
--migrate-down
        migrations down.
--inflate
        inflates the application into a directory using esbuild.
--inflate-dir
        to set the output directory of the --inflate command. default value is inflated/.
--editor
        runs the application with a built-in editor.
--generate-doc
        generates a documentation for the api endpoints of the service.
--generate-doc-out
        the output file for the generated documentation. default value is API.md.
--generate-doc-type
        the format of the generated documentation. it can be JSON or MD. default value is MD.
--generate-doc-all
        outputs all the server routes in the documentation output.
--compile
        inflates the application and tries to create a NODE SEA binary.
--no-build
        disables calling esbuild during imports in runtime. Notice that to use jsx you will need to run tsc or esbuild on your jsx files to transpile them to js.
--no-minify
        disables calling minifing min.js files.
--inflate-only-assets
        inflates ONLY the application assets. must be used with --inflate.
--inflate-flat
        inflates files into the inflate-dir directly.
--inflate-sea
        inflates the application with sea compilation scripts.
--install-tsconfig
        creates a tsconfig.json configured to use with --install-types.
--install-miqrojson
        creates a default miqro.json file.
--install
        creates a node_modules folder from binary cache (only available in sea binary).
--disable-miqrojson
        disables the load of miqro.json file.
--log-file
        overrides the default log file from LOG_FILE.
--browser
        overrides the default browser from BROWSER.
--config
        overrides the default miqro.json path.
--port
        overrides the default port from PORT.
--name
        overrides the default name of the server.
--https
        serves the server in https instead of http
--https-key
        point to a server.key file for https.
--https-cert
        point to a server.cert file for https.
--https-redirect
        serves an aditional http server that redirects to https. it needs a port number.
--inflate-parallel
        sets the max parallel esbuild instances. defaults to 1.

==environment variables==

PORT
        override the default 8080 port.
BROWSER
        override the default browser. change to none to disable.".
LOG_FILE
        override the default ./server.log file
DB
        enable the server.db features
DB_STORAGE
        override the default local db location ./db.sqlite3
DB_DIALECT
        override the default node:sqlite
DB_CONNECTION
        override the default connection url
CLEAR_JSX_CACHE
        set to 1 or 0 to enable or disable the clearing of the esbuild cache defaults to 1.
JSX_TMP
        set custom location of esbuild builds defaults to /tmp/jsx_tmp.
```

## development

### build node package

1. install dependencies

```npm install```

2. build

```npm build```

### build binary for running as standalone binary

1. install dependencies

```npm install```

2. install sea deps (esbuild and nodejs binaries)

```npm run precompile``` or ```sh ./sea/precompile.sh```

3. compile

```npm run compile``` or ```sh ./compile.sh```

to binaries will be produced in the ```bin/``` folder.

example

```./bin/linux-x64/miqro --help```

you can copy this binary to a computer without Node.js installed and run it to try.
