rm -Rf sea/types;

mkdir -p sea/types/@miqro/query
cp -R ./node_modules/@miqro/query/build/ ./sea/types/@miqro/query

mkdir -p sea/types/@miqro/core
cp -R ./node_modules/@miqro/core/build/ ./sea/types/@miqro/core

mkdir -p sea/types/@miqro/parser
cp -R ./node_modules/@miqro/parser/build/ ./sea/types/@miqro/parser

mkdir -p sea/types/@miqro/request
cp -R ./node_modules/@miqro/request/build/ ./sea/types/@miqro/request

mkdir -p sea/types/@miqro/jsx
cp -R ./node_modules/@miqro/jsx/build/ ./sea/types/@miqro/jsx

mkdir -p sea/types/@miqro/test/dist
cp -R ./node_modules/@miqro/test/dist/ ./sea/types/@miqro/test/dist

rm ./sea/types/@miqro/**/*.js
rm ./sea/types/@miqro/**/**/*.js
rm ./sea/types/@miqro/**/**/**/*.js
rm ./sea/types/@miqro/**/**/**/**/*.js
rm ./sea/types/@miqro/**/*.map
rm ./sea/types/@miqro/**/**/*.map
rm ./sea/types/@miqro/**/**/**/*.map
#rm ./sea/types/@miqro/**/**/**/**/*.map

cp src/types/@miqro/core.d.ts sea/types/@miqro/core.d.ts
cp src/types/@miqro/jsx.d.ts sea/types/@miqro/jsx.d.ts
cp src/types/@miqro/parser.d.ts sea/types/@miqro/parser.d.ts
cp src/types/@miqro/request.d.ts sea/types/@miqro/request.d.ts
cp src/types/@miqro/query.d.ts sea/types/@miqro/query.d.ts
cp src/types/@miqro/test.d.ts sea/types/@miqro/test.d.ts

cp src/types/@miqro.d.ts sea/types/@miqro.d.ts
cp src/types/@types.d.ts sea/types/@types.d.ts
cp src/types/postject.d.ts sea/types/postject.d.ts
cp src/types/@esbuild.d.ts sea/types/@esbuild.d.ts

cp src/types/miqro.d.ts sea/types/miqro.d.ts
cp src/types/globals.d.ts sea/types/globals.d.ts
cp src/types/server.globals.d.ts sea/types/server.globals.d.ts
cp src/types/browser.globals.d.ts sea/types/browser.globals.d.ts
cp src/types/jsx.globals.d.ts sea/types/jsx.globals.d.ts
