#!/usr/bin/env sh

export NODE_OPTIONS="--experimental-sqlite"

sh sea/precompile.sh

NODE_BIN="sh sea/node.sh"
SIGN_REMOVE_BIN="sh sea/sign-remove.sh"
SIGN_ADD_BIN="sh sea/sign-add.sh"
ESBUILD_BIN="sh sea/esbuild.sh"
TSC_BIN="sh sea/tsc.sh"

#types.json
# sh sea/copy-types.sh
# $NODE_BIN sea/generate-global-types-asset-json.js

#version.tag
$NODE_BIN sea/version.tag.js

rm -Rf bin;
mkdir -p bin/;
rm -Rf build;
mkdir -p build/;

#check source code with tsc
echo $TSC_BIN
$TSC_BIN

#CURRENT_GIT_BRANCH=`git rev-parse --abbrev-ref HEAD`
#CURRENT_GIT_SHORT_HASH=`git rev-parse --short HEAD`
#CURRENT_DATE=`date +"%y-%m-%d"`
#VERSION_TAG="${CURRENT_DATE}_${CURRENT_GIT_SHORT_HASH}_${CURRENT_GIT_BRANCH}"

#echo $VERSION_TAG > sea/version.tag

# font.ttf
cp sea/editor-assets/font.ttf build/font.ttf

# style.css
cp sea/editor-assets/style.css build/style.css

# jsx.js
cp node_modules/@miqro/jsx-dom/build/jsx-dom.esm.bundle.js build/jsx.dom.js

# postject.js
$ESBUILD_BIN node_modules/postject/dist/cli.js --bundle --platform=node --outfile=build/postject.cjs
$NODE_BIN sea/base64.js build/postject.cjs > build/postject.base64.cjs
$NODE_BIN sea/base64.js sea/basic-compile.sh > sea/basic-compile.base64.sh
POSTJECT_BIN="${NODE_BIN} build/postject.cjs"

# editor.bundle.js
$ESBUILD_BIN --external:node:process --external:node:path --bundle --loader:.js=jsx --jsx-factory=jsx.createElement --jsx-fragment=jsx.Fragment sea/editor-assets/editor.bundle.in.mjs --outfile=build/editor.bundle.js

# main.js
$ESBUILD_BIN src/main.ts --bundle --platform=node --outfile=build/main.js --external:sqlite3 --external:pg --external:esbuild
#cp build/main.js build/main.bundle.cjs

#lib.js
$ESBUILD_BIN src/lib.ts --bundle --platform=node --outfile=build/lib.cjs --external:sqlite3 --external:pg --external:esbuild --external:node:assert --external:node:util --external:node:path

# sea-config.blob

$NODE_BIN --experimental-sqlite --experimental-sea-config sea/config/sea-config-darwin-arm64.json
$NODE_BIN --experimental-sea-config sea/config/sea-config-darwin-x64.json

$NODE_BIN --experimental-sea-config sea/config/sea-config-linux-arm64.json
$NODE_BIN --experimental-sea-config sea/config/sea-config-linux-x64.json

#$NODE_BIN --experimental-sea-config sea/config/sea-config-win-arm64.json
#$NODE_BIN --experimental-sea-config sea/config/sea-config-win-x64.json

# bin/

TARGET_BIN_NAME="miqro"

TARGET_LINUX_X64="bin/linux-x64/${TARGET_BIN_NAME}"
TARGET_LINUX_ARM64="bin/linux-arm64/${TARGET_BIN_NAME}"

TARGET_DARWIN_ARM64="bin/darwin-arm64/${TARGET_BIN_NAME}"
TARGET_DARWIN_X64="bin/darwin-x64/${TARGET_BIN_NAME}"

#TARGET_WIN_X64="bin/win-x64/${TARGET_BIN_NAME}.exe"
#TARGET_WIN_ARM64="bin/win-arm64/${TARGET_BIN_NAME}.exe"

mkdir -p bin/linux-x64
mkdir -p bin/linux-arm64

mkdir -p bin/darwin-x64
mkdir -p bin/darwin-arm64

#mkdir -p bin/win-x64
#mkdir -p bin/win-arm64

cp sea/deps/nodejs/darwin/arm64/node "${TARGET_DARWIN_ARM64}"
cp sea/deps/nodejs/darwin/x64/node "${TARGET_DARWIN_X64}"

cp sea/deps/nodejs/linux/x64/node "${TARGET_LINUX_X64}"
cp sea/deps/nodejs/linux/arm64/node "${TARGET_LINUX_ARM64}"

#cp sea/deps/nodejs/win/x64/node.exe "${TARGET_WIN_X64}"
#cp sea/deps/nodejs/win/x64/node.exe "${TARGET_WIN_ARM64}"

$SIGN_REMOVE_BIN "${TARGET_DARWIN_ARM64}"
$SIGN_REMOVE_BIN "${TARGET_DARWIN_X64}"

chmod +w "${TARGET_LINUX_ARM64}"
chmod +w "${TARGET_LINUX_X64}"

chmod +w "${TARGET_DARWIN_ARM64}"
chmod +w "${TARGET_DARWIN_X64}"

#chmod +w "${TARGET_WIN_X64}"
#chmod +w "${TARGET_WIN_ARM64}"

# copy main script

cp sea/main.sh bin/$TARGET_BIN_NAME
chmod +x bin/$TARGET_BIN_NAME

# inject blob

$POSTJECT_BIN "${TARGET_DARWIN_ARM64}" NODE_SEA_BLOB build/sea-prep-darwin-arm64.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA
$SIGN_ADD_BIN "${TARGET_DARWIN_ARM64}"
$POSTJECT_BIN "${TARGET_DARWIN_X64}" NODE_SEA_BLOB build/sea-prep-darwin-x64.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA
$SIGN_ADD_BIN "${TARGET_DARWIN_X64}"

$POSTJECT_BIN "${TARGET_LINUX_ARM64}" NODE_SEA_BLOB build/sea-prep-linux-arm64.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
$POSTJECT_BIN "${TARGET_LINUX_X64}" NODE_SEA_BLOB build/sea-prep-linux-x64.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

#$POSTJECT_BIN "${TARGET_WIN_X64}" NODE_SEA_BLOB build/sea-prep-win-x64.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
#$POSTJECT_BIN "${TARGET_WIN_ARM64}" NODE_SEA_BLOB build/sea-prep-win-arm64.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2


