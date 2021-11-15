# miqro

helpers for creating api with nodejs **http** module and **sequelize**.

this module is just a **cli** for the following npm modules.

- logging, config loading, feature toggling see [@miqro/core](https://www.npmjs.com/package/@miqro/core)

- integration for **cookie**, **uuid** and **jsonwebtoken** modules [@miqro/handlers](https://www.npmjs.com/package/@miqro/handlers)

- some helpers for doing pagination, searching, etc when using **sequelize** [@miqro/modelhandlers](https://www.npmjs.com/package/@miqro/modelhandlers)

- some helpers for starting a cluster with auto restart if crash [@miqro/runner](https://www.npmjs.com/package/@miqro/runner)


## cli for development

```
npm install miqro --save-dev
```

to see available cmds

```
npx miqro
```
