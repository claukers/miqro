# miqro development cli

```
npm install miqro --save-dev
```

to see available cmds

```
npx miqro
```

```
Available commands:

==api development==

new                                     create a new project.
new:typescript                          create a new typescript project.
new:main                                creates a new main file.
new:route                               creates a new route.
config                                  print config as a json.
config:bash                             print config as a bash script.
config:env                              print config as a env file.
config:init                             inits your config folder.
doc                                     api folder auto doc as a json.
doc:md                                  api folder auto doc as a markdown.

==front development==

new:front                               create a new project.
new:front:typescript                    create a new typescript project.
generate:template:cache                 generate cache.json for webcomponents.
sfc                                     transform sfc files to javascript.

==start helpers==

start                                   start script in cluster mode.
watch                                   watch folder for changes.
serve                                   serve static files.

==testing==

test                                    run test files.
new:test                                create new test.js file.

==sequelize helpers==

db:console                              a query console for sequelize.
db:dump:data                            dump the data of the database.
db:push:data                            push a dump to the database.
db:make:migration                       generate migrations from model changes.
db:make:migration:force:clean:state     force 'local' model state.
db:migrate                              loads config and run migrations.
db:init                                 init sequelize configuration.
db:create:model                         creates an example model.
```
