# miqro

helpers for creating api with nodejs **http** module and **sequelize**.

this module is just a **cli** for the following npm modules.

- logging, config loading, feature toggling see [@miqro/core](https://www.npmjs.com/package/@miqro/core)

- api handlers, body parsing, etc see [@miqro/handlers](https://www.npmjs.com/package/@miqro/handlers)

- sequelize integration see [@miqro/database](https://www.npmjs.com/package/@miqro/database)

- some helpers for doing pagination, searching, etc [@miqro/modelhandlers](https://www.npmjs.com/package/@miqro/modelhandlers)

- some helpers for starting a cluster with auto restart if crash [@miqro/runner](https://www.npmjs.com/package/@miqro/runner)

## quickstart

```
npx miqro new:typescript my-app
```

or without typescript

```
npx miqro new my-app
```

create a sample route

```
npx miqro new:route src_api_v1_user_post
```

this will create a file at ```src/api/v1/user/post.ts``` that will be mounted as ***POST /api/v1/user***. See ```src/main.ts``` and look for the line refering to **APIRouter** to learn how it's mounted.

to generate api documentation.

```
npx miqro doc:md src/api/ /api API.md
```

or if you want a json

```
npx miqro doc src/api/ /api > api.json
```

declare routes creating files in ```src/api/```

APIRouter is a FeatureRouter so to disable routes you can set an ENV VAR with the name of the feature to **false**.

```
API_HEALTH_GET=false
```

## sequelize integration

```npx miqro db:init```

```typescript
import { loadSequelize } from "@miqro/database";

const sequelize = loadSequelize();
```


## cli for development

```npm install miqro --save-dev```

```
npx miqro <command> [args]
```

to see available cmds

```
npx miqro
```
