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

```
npx miqro <command> [args]
```

to see available cmds

```
npx miqro
```

```
Available commands:

quick start

	new					    create a new project

http scafolding

	new:main				creates a new main file
	new:typescript			create a new typescript project
	new:route				creates a new route

config managment

	config					outputs to stdout the config as a json
	config:bash				outputs to stdout the config as a bash script
	config:env				outputs to stdout the config as a env file
	config:init				inits your config folder

cluster start

	start					start a nodejs script in cluster mode and restart if crash.

api documentation

	doc					    outputs to stdout an api folder auto doc as a json
	doc:md				    outputs to a file an api folder auto doc as a markdown

sequelize helpers

	db:console				runs a readline interface that send the input as a query
	db:dump:data			dump the data of the database (only defined models)
	db:push:data			push a dump to the database
	db:make:migration		seeks changes in your models and creates migrations
	db:make:migration:force:clean:state	regenerate _current.json in the migrations folder to force the 'local' migration state to be the same as the current models.
	db:init					init sequelize configuration.
	db:create:model			creates an example model
```
