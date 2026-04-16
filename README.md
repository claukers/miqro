# miqro

**experimental** Node.js web framework built from scratch with minimal runtime dependencies.

fully typed TypeScript · REST · WebSocket · SQL · JWT · HTTP

runtime dependencies: `jose`, `esbuild`, `cookie`, `showdown`

- **Web Components** using JSX — server-rendered and client-side
- **static site generation** — `.html.tsx` handlers run against a live DB at build time
- **REST API** endpoints with request/response validation
- **database** — `sqlite3`, `node:sqlite`, `postgres` with migrations
- **cluster** — multi-worker with shared cache and hot reload
- **NODE:SEA** — single binary, no Node.js required on target machine
- **built-in editor**, **test runner**, **API doc generation**

## packages

```
miqro
├── @miqro/core       router, middleware, session, CORS, logger
├── @miqro/jsx        vDOM, hooks, SSR runtime
├── @miqro/jsx-dom    Web Component define, browser runtime
├── @miqro/jsx-node   node SSR runtime
├── @miqro/query      query builder, ORM, migrations
├── @miqro/parser     schema validation
├── @miqro/request    http client
├── @miqro/runner     cluster manager
├── @miqro/test       test runner
└── @miqro/test-http  http test helper
```

`@miqro/test` and `@miqro/request` are being phased out in favor of `node:test` and built-in `fetch`.

package docs: [@miqro/core](core-README.md) · [@miqro/query](query-README.md) · [@miqro/jsx](jsx-README.md) · [@miqro/jsx-dom](jsx-dom-README.md) · [@miqro/jsx-node](jsx-node-README.md) · [@miqro/request](request-README.md) · [@miqro/runner](runner-README.md) · [@miqro/test](test-README.md) · [@miqro/test-http](test-http-README.md) · [@miqro/parser](parser-README.md)

## composition

services run sequentially. each service runs on every request until a route sends a response.

```json
{
  "services": ["a/", "b/", "c/"]
}
```

```
request →
  a/ runs (auth.ts, middleware.ts, then http/ routes)
  if no route in a/ matched, b/ runs
  if no route in b/ matched, c/ runs
```

earlier services establish state. later services consume it.

```
a/auth.ts    → sets req.session
b/db.ts      → req.server.db.get("b") available
c/http/      → has req.session and req.server.db, handles routes
```

`req.session.account` is the tenant identifier. use it to isolate data:

```ts
// any handler in c/
const posts = await req.server.db.get("b")
  .select().from("posts")
  .eq("account", req.session.account)
  .yield();
```

seed shared state in `server.ts` using `isPrimaryWorker()`:

```ts
// a/server.ts
export default {
  load: async (server) => {
    if (server.isPrimaryWorker()) {
      const config = await server.db.get("b").select().from("config").yield();
      server.cache.set("config", config);
    }
  }
}
```

swap `a/` for a different implementation — `b/` and `c/` don't change. they read from `req.session`, not from `a/` directly.

same service folders, different `miqro.json`:

```json
{ "services": ["a1/", "b/", "c/"] }   // production auth
{ "services": ["a2/", "b/", "c/"] }   // test auth
{ "services": ["b/", "c/"] }          // no auth
```

service folders can be npm packages:

```json
{
  "services": [
    "node_modules/@myorg/auth/service/",
    "node_modules/@myorg/db/service/",
    "services/app/"
  ]
}
```

## installation

### standalone binary (no Node.js required) ( Not Up-To-Date versions )

download from [releases](https://github.com/claukers/miqro/releases). (diff release cycle so expect OLD versions published)

for newer releases use the npm install and the npx miqro --compile to produce a standalone binary of the app

### npm

```
npm install miqro
```

## getting started

```
mkdir -p example/http
```

`example/http/index.html.tsx`

```tsx
import JSX from "@miqro/jsx";

export default (req, res) => {
  return <html>
    <body>
      <h1>Hello World!</h1>
    </body>
  </html>
}
```

```
miqro --watch --service example/
```

open `http://localhost:8080/index.html`.

### generate static files

```
miqro --inflate --inflate-dir build/ --service example/
```

output in `build/example/static/`. serve with any http server.

## service folder

```
app/
  http/          endpoints
  static/        files served as-is
  migration/     db migrations
  test/          tests
  db.ts          database config
  ws.ts          websocket config
  auth.ts        session/auth config
  server.ts      lifecycle hooks
  log.ts         log transport config
  middleware.ts  pre/post route middleware
  catch.ts       error handlers
  miqro.json     multi-service composition
```

all files and folders are optional.

```
miqro --service app/
miqro --service app/ --editor
```

## http folder

files are served by their path in the directory.

```
http/
  index.html.tsx      → GET /index.html
  posts/
    index.html.tsx    → GET /posts/index.html
    list.api.ts       → GET /posts/list
  js/
    app.min.tsx       → GET /js/app.js (minified bundle)
```

### .html.tsx

server-rendered JSX. runs at request time or at build time with `--inflate`.

```tsx
import JSX from "@miqro/jsx";

export default (req, res) => {
  return <html>
    <body>
      <h1>Hello</h1>
    </body>
  </html>
}
```

with database access:

```tsx
import JSX from "@miqro/jsx";

export default async (req, res) => {
  const posts = await req.server.db.get("mydb")
    .select().from("posts").yield();
  
  return <html>
    <body>
      {posts.map(p => <h2>{p.title}</h2>)}
    </body>
  </html>
}
```

customize path/method with `apiOptions`:

```tsx
import JSX from "@miqro/jsx";
import { APIOptions } from "miqro";

export const apiOptions: APIOptions = {
  path: ["/", "/index.html"],
  method: ["GET"]
};

export default (req, res) => { ... }
```

### .min.tsx

bundled and minified client-side JavaScript. use to define Web Components.

```tsx
import JSX, { useState } from "@miqro/jsx";
import { define } from "@miqro/jsx-dom";

function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>count: {n}</button>;
}

define("my-counter", Counter, {
  observedAttributes: ["initial"],
  shadowInit: false
});
```

included in HTML:

```tsx
export default (req, res) => (
  <html>
    <body>
      <my-counter initial="0" />
      <script src="/js/app.js" />
    </body>
  </html>
);
```

### .api.ts

REST endpoint. file path is the route path.

```ts
export default (req, res) => {
  return res.json({ ok: true });
}
```

full declaration with validation:

```ts
import { APIRoute, JSONParser } from "@miqro/core";

export default {
  name: "create post",
  method: "POST",
  middleware: [JSONParser()],
  request: {
    body: {
      title: "string",
      content: "string"
    }
  },
  response: {
    status: [200],
    body: {
      id: "number"
    }
  },
  handler: async (req, res) => {
    const post = await req.server.db.get("mydb")
      .insert("posts")
      .values({ title: req.body.title, content: req.body.content })
      .returning("id")
      .yield();
    return res.json({ id: post[0].id });
  }
} as APIRoute;
```

`method: "use"` registers the handler for all methods (middleware pattern):

```ts
import { Router } from "@miqro/core";

const router = new Router();
router.use(myMiddleware);

export default {
  path: "/admin",
  method: "use",
  handler: router
}
```

### .html.md

markdown file converted to HTML. served as `text/html`.

```
http/
  docs/
    guide.html.md    → GET /docs/guide
```

`guide.html.md`:

```markdown
# Guide

some **markdown** content.
```

converted using `showdown`. also works with `--inflate` — outputs static HTML.

available as `req.server.inflateMDtoHTML(str)` from any handler.


## static folder

files served as-is, by path.

```
static/
  logo.png     → GET /logo.png
  style.css    → GET /style.css
```

## db.ts

```ts
import { DBConfig } from "miqro";

export default {
  dialect: "node:sqlite",       // node:sqlite | sqlite3 | pg
  name: "mydb",                 // req.server.db.get("mydb")
  storage: "./data.sqlite3",    // sqlite only
  // connectionString: "..."    // postgres
} as DBConfig;
```

migrations run automatically on startup (primary worker only).

## migration folder

files named `NNN_name.ts` run in order.

```ts
// migration/001_create_posts.ts
import { MigrationModule } from "miqro";

export default {
  name: "001_create_posts",
  dbName: "mydb",
  up: async (db) => {
    await db.createTable("posts", {
      id: { type: "integer", primaryKey: true, autoIncrement: true },
      title: { type: "string" },
      content: { type: "string" }
    }).yield();
  }
} as MigrationModule;
```

run manually:

```
miqro --migrate-up --service app/
miqro --migrate-down --service app/
```

## cors.ts

```ts
import { CORSOptions } from "miqro";

export default {
  origins: ["https://myapp.com", "https://staging.myapp.com"],
  methods: "GET,POST,PUT,DELETE"
} as CORSOptions;
```

without `cors.ts` all origins are allowed. with it only listed origins are accepted — requests from other origins get `400 Bad Request`.


## ORM

quick reference. full docs in [@miqro/query](query-README.md).

```ts
import { defineModel } from "@miqro/query";

const Post = defineModel(db, "posts", {
  id:        { type: "integer", primaryKey: true, autoIncrement: true },
  title:     { type: "string" },
  published: { type: "boolean" },
  createdAt: { type: "datetime" }
});

// create
await Post.create({ title: "hello", published: false });

// findAll
const posts = await Post.findAll(
  Post.where().eq("published", true).order("createdAt", "DESC"),
  { limit: 10 }
);

// updateAll
await Post.updateAll({ published: true }, Post.where().eq("id", 1));

// deleteAll
await Post.deleteAll(Post.where().eq("id", 1));

// count
const n = await Post.count(Post.where().eq("published", true));

// sync (create table if not exists)
await Post.sync();
```

access the db directly:

```ts
const db = req.server.db.get("mydb");
const rows = await db.select().from("posts").eq("published", true).yield();
const raw = await db.query("SELECT * FROM posts WHERE id = ?", [1]);
```


## ws.ts

```ts
import { WSConfig } from "miqro";

export default {
  path: "/updates",   // req.server.ws.get("/updates")
  disabled: false
} as WSConfig;
```

broadcast from a handler:

```ts
export default async (req, res) => {
  const ws = req.server.ws.get("/updates");
  await ws.broadcast(JSON.stringify({ type: "update", data: "..." }));
  return res.json({ ok: true });
}
```

### WebSocket client (.min.tsx)

```tsx
import JSX, { useState, useEffect } from "@miqro/jsx";
import { define } from "@miqro/jsx-dom";

function LiveFeed(props) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://${location.host}/updates`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setMessages(prev => [...prev, msg]);
    };
    return () => ws.close();
  }, []);

  return <ul>{messages.map((m, i) => <li>{m.text}</li>)}</ul>;
}

define("live-feed", LiveFeed, { shadowInit: false });
```

broadcast from a handler:

```ts
// http/publish.api.ts
export default async (req, res) => {
  const ws = req.server.ws.get("/updates");
  await ws.broadcast(JSON.stringify({ text: req.body.text }));
  return res.json({ ok: true });
}
```


## auth.ts

```ts
import { AuthConfig, jwt } from "miqro";
import { createSecretKey } from "node:crypto";

const secret = createSecretKey(Buffer.from(process.env.JWT_SECRET, "hex"));

export default {
  verify: async ({ token }) => {
    try {
      const payload = await jwt.verify(token, secret);
      return {
        account: payload.account as string,
        username: payload.username as string,
        groups: payload.groups as string[],
        token
      };
    } catch {
      return null;
    }
  }
} as AuthConfig;
```

session available on `req.session`:

```ts
req.session.account   // tenant identifier
req.session.username
req.session.groups
req.session.token
```

restrict by group using `policy` on any endpoint:

```ts
export default {
  policy: {
    groups: ["admin"],
    groupPolicy: "at_least_one"
  },
  handler: ...
}
```

## server.ts

lifecycle hooks.

```ts
import { ServerConfig } from "miqro";

export default {
  preload: async (server) => {
    // runs before db connections
  },
  load: async (server) => {
    // runs after db connections, before listening
    // seed cache here
    const rows = await server.db.get("mydb").select().from("config").yield();
    server.cache.set("config", rows);
  },
  start: async (server) => {
    // runs after listening
  },
  stop: async (server) => {
    // runs on shutdown
  }
} as ServerConfig;
```

`load` runs on all workers. use `server.isPrimaryWorker()` to gate one-time operations.

## middleware.ts

pre and post route middleware for the service.

```ts
import { MiddlewareConfig } from "miqro";

export default {
  middleware: [
    // runs before all routes
    async (req, res) => {
      req.startTime = Date.now();
    }
  ],
  post: [
    // runs after all routes
    async (req, res) => {
      req.logger.debug("took %dms", Date.now() - req.startTime);
    }
  ]
} as MiddlewareConfig;
```

## catch.ts

error handlers.

```ts
import { ErrorConfig } from "miqro";

export default {
  catch: [
    async (err, req, res) => {
      req.logger.error(err);
      return res.json({ error: err.message }, {}, 500);
    }
  ]
} as ErrorConfig;
```

## log.ts

custom log transport. called for every log message.

```ts
import { LogConfig } from "miqro";

export default {
  level: "error",              // only receive messages at this level
  replaceConsoleTransport: false,  // keep default console output
  replaceFileTransport: false,     // keep default file output
  write: async ({ out, level, identifier }) => {
    // out       — formatted log string
    // level     — "error" | "warn" | "info" | "debug" | "trace"
    // identifier — route/worker identifier
    await fetch("https://logs.example.com/ingest", {
      method: "POST",
      body: JSON.stringify({ out, level, identifier })
    });
  }
} as LogConfig;
```

log levels: `error` → `warn` → `info` → `debug` → `trace` → `none`

default output: console + `./server.log` (or `LOG_FILE` env var).

per-identifier level override via env:

```
LOG_LEVEL=info
LOG_LEVEL_POSTS_GET=debug    // debug only for GET /posts
LOG_LEVEL_WORKER_0=trace     // trace only for worker 0
```

**cluster mode:** each worker writes to the same log file independently. at high throughput use pipes instead of `FileTransport`:

```
miqro --service app/ 2>&1 | tee app.log
```

or send to an external aggregator via `log.ts` `write`.

## doc.ts

publish API documentation as a static file or live endpoint.

```ts
import { DocConfig } from "miqro";

export default {
  publish: {
    "/api/docs":   { type: "MD" },    // markdown
    "/api/schema": { type: "JSON" },  // json
    "/api/docs.html": { type: "HTML" } // html
  }
} as DocConfig;
```

with `--inflate` the docs are written to `build/` as static files.

at runtime the docs are served as live endpoints — useful for development.

generate docs via CLI:

```
miqro --generate-doc --generate-doc-out API.md --service app/
miqro --generate-doc --generate-doc-type JSON --generate-doc-out api.json --service app/
```

doc output is derived from `APIRoute` declarations — `name`, `description`, `request`, `response`, `policy` fields.


## miqro.json

compose multiple services.

```json
{
  "name": "myapp",
  "port": "3000",
  "services": [
    "a/",
    "b/",
    "c/"
  ],
  "inflateDir": "build/",
  "logFile": false,
  "browser": true
}
```

all fields optional except `services`.

```
name        server name — required in cluster mode
port        default: 8080
services    ordered list of service folders
inflateDir  default inflate output directory
logFile     false | true | "./path/server.log"
browser     open browser on start (true | false | "browser-name")
```

generate default `miqro.json`:

```
miqro --install-miqrojson
```

run with miqro.json:

```
miqro
```

or override:

```
miqro --service a/ --service b/
```

swap implementations by changing the services array. same service folders work across different compositions.

## req.server

available on every handler.

```ts
req.server.db.get("name")          // Database | null
req.server.ws.get("/path")         // WebSocketServer | undefined
req.server.cache                   // ClusterCache — synced across all cluster workers via IPC
req.server.localCache              // LocalCache — in-memory, per worker only
req.server.cache.set("key", value)
req.server.cache.get("key")
req.server.cache.has("key")
req.server.cache.unset("key")
req.server.cache.set_add("key", value)   // set operations
req.server.cache.set_has("key", value)
req.server.cache.set_delete("key", value)

req.server.middleware.json()       // body parser → req.body
req.server.middleware.url()        // url-encoded body parser → req.body
req.server.middleware.text()       // text body parser → req.body
req.server.middleware.buffer()     // raw buffer → req.buffer
req.server.middleware.cors(opts)   // CORS middleware
req.server.middleware.session(opts)// auth middleware

req.server.jwt.sign(payload, secret, opts)
req.server.jwt.verify(token, secret, opts)
req.server.jwt.decode(token)

req.server.isPrimaryWorker()       // true on worker 0
req.server.getWorkerNumber()       // 0..n
req.server.getWorkerCount()        // total workers

req.server.reload()                // hot reload
req.server.restart()               // full restart
req.server.stop()                  // shutdown

req.server.encodeHTML(str)
req.server.inflateMDtoHTML(str)
req.server.newParser()
req.server.newClusterCache(name)
req.server.newLocalCache(name)
req.server.getLogger(identifier)
```

## req

```ts
req.path          // normalized pathname
req.hash          // url hash fragment
req.searchParams  // URLSearchParams
req.query         // parsed query string { [key]: string | string[] }
req.params        // path parameters { [key]: string }
req.cookies       // parsed cookies { [name]: string }
req.body          // parsed body (requires body parser middleware)
req.buffer        // raw body buffer (requires ReadBuffer middleware)
req.session       // set by auth.ts
req.session.account   // tenant identifier
req.session.username
req.session.groups    // string[]
req.session.token
req.uuid          // unique request id
req.startMS       // request start timestamp ms
req.logger        // per-request logger — includes path/method/uuid/remoteAddress
req.results       // pipeline accumulator
```

## test folder

test files named `*.test.ts`.

```ts
import { describe, it } from "node:test";
import { strictEqual } from "assert";

describe("posts", () => {
  it("GET /posts returns 200", async () => {
    const res = await test.request({
      url: "/posts",
      method: "GET",
      disableThrow: true
    });
    strictEqual(res.status, 200);
  });
});
```

`test.request` hits the running miqro server via Unix socket. no port needed.

test JSX components:

```ts
import JSX from "@miqro/jsx";
import { Counter } from "./counter.js";

it("renders counter", test.jsx.test(async (container, root, runtime) => {
  container.render(JSX.createElement(Counter, { initial: 0 }));
  strictEqual(root.innerHTML.includes("0"), true);
}));
```

run tests:

```
miqro --test --service app/
```

## Miqro object

```ts
import { Miqro } from "miqro";

const app = new Miqro({
  services: ["app/"],
  port: "3000",
  name: "myapp",       // required in cluster mode
  hotreload: false,
  editor: false
});

await app.inflate({ inflateDir: "build/" });  // generate static files
await app.inflate();                           // inflate to memory
await app.start();                             // start server
await app.stop();                              // stop server
await app.reload();                            // hot reload
await app.restart();                           // full restart
await app.dispose();                           // cleanup cluster connections
```

trigger static generation from a running server:

```ts
export default {
  path: "/publish",
  method: "POST",
  handler: async (req, res) => {
    const generator = new Miqro({ services: ["app/"] });
    await generator.inflate({ inflateDir: "build/" });
    return res.json({ ok: true });
  }
}
```

## cluster

```
npx miqro-cluster --service app/
CLUSTER_COUNT=4 npx miqro-cluster --service app/
npx miqro-cluster
```

to run arbitrary scripts in cluster mode:

```
npx miqro-runner server.js
CLUSTER_COUNT=4 npx miqro-runner server.js
```

## --no-build

use tsc instead of esbuild. run tsc first, then miqro.

generate a tsconfig:

```
miqro --install-tsconfig
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "noEmit": true,
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "lib": ["es2021", "dom"],
    "jsx": "react",
    "jsxFactory": "JSX.createElement",
    "jsxFragmentFactory": "JSX.Fragment"
  }
}
```

`noEmit: true` — tsc type-checks only, esbuild handles transpilation at runtime. remove `noEmit` and set `outDir` to use tsc output with `--no-build`.

development with tsc + miqro:

```
tsc --watch &
miqro --no-build --watch --service app/
```

**note:** in `--no-build` mode module-level state is shared across routes within a process. the stateless coding guarantee that esbuild provides does not apply. avoid module-level mutable state.

## static site generator

```
miqro --inflate --inflate-dir build/ --service app/
```

`.html.tsx` handlers run with a live db connection. output is static HTML written to `build/`.

```
miqro --inflate --inflate-dir build/ --service app/
python3 -m http.server 8080 build/app/static/
```

## https

```
miqro --https --https-key server.key --https-cert server.cert --service app/
```

with http redirect:

```
miqro --https --https-key server.key --https-cert server.cert --https-redirect 8080 --service app/
```

starts an additional http server on port 8080 that redirects all requests to https.

via env or `miqro.json`:

```json
{
  "https": true,
  "httpsKey": "./server.key",
  "httpsCert": "./server.cert",
  "httpsRedirect": "8080"
}
```


## cli

```
miqro --service app/
miqro --watch --service app/
miqro --editor --service app/
miqro --test --service app/
miqro --migrate-up --service app/
miqro --migrate-down --service app/
miqro --inflate --inflate-dir build/ --service app/
miqro --generate-doc --generate-doc-out API.md --service app/
miqro --compile --service app/
```

flags:

```
--watch                 auto reload on file changes
--hot-reload            enable hot-reload with --watch
--test                  run tests
--migrate-up            run migrations up
--migrate-down          run migrations down
--inflate               generate static files
--inflate-dir           output directory (default: inflated/)
--editor                run with built-in editor
--generate-doc          generate API documentation
--generate-doc-out      output file (default: API.md)
--generate-doc-type     MD | JSON | HTML (default: MD)
--generate-doc-all      include all routes
--compile               build NODE:SEA binary
--no-build              skip esbuild, use pre-compiled files
--no-minify             skip minification
--inflate-only-assets   inflate assets only
--inflate-flat          inflate into dir directly
--inflate-sea           inflate with SEA compilation scripts
--install-tsconfig      create tsconfig.json
--install-miqrojson     create miqro.json
--install               install from binary cache (SEA only)
--disable-miqrojson     ignore miqro.json
--log-file              override LOG_FILE
--browser               override BROWSER
--config                override miqro.json path
--port                  override PORT
--name                  override server name
--https                 serve with https
--https-key             path to server.key
--https-cert            path to server.cert
--https-redirect        http redirect port
--inflate-parallel      max parallel esbuild instances (default: 1)
```

environment variables:

```
PORT                    default: 8080
BROWSER                 default browser, none to disable
LOG_FILE                default: ./server.log
LOG_LEVEL               error | warn | info | debug | trace | none
LOG_LEVEL_<IDENTIFIER>  per-route log level
DB                      enable db features
DB_STORAGE              sqlite storage path (default: ./db.sqlite3)
DB_DIALECT              node:sqlite | sqlite3 | pg
DB_CONNECTION           connection url (postgres)
CLEAR_JSX_CACHE         clear esbuild cache (default: 1)
JSX_TMP                 esbuild tmp dir (default: /tmp/jsx_tmp)
CLUSTER_COUNT           number of cluster workers
```

## build

```
npm install
npm run build
```

### SEA binary

```
npm install
npm run precompile
npm run compile
```

binaries in `bin/`.

```
./bin/linux-x64/miqro --help
```