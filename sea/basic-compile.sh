#!/usr/bin/env sh

rm -Rf bin;
mkdir -p bin/;

sh ./install-nodejs.sh

NODE_BIN="sh sea/node.sh"
SIGN_REMOVE_BIN="sh sea/sign-remove.sh"
SIGN_ADD_BIN="sh sea/sign-add.sh"
POSTJECT_BIN="${NODE_BIN} sea/postject.cjs"
ESBUILD_BIN="sea/esbuild"

$ESBUILD_BIN sea/app.cjs --bundle --platform=node --external:sqlite3 --external:pg --external:esbuild --outfile=sea/app.bundle.cjs

$NODE_BIN --experimental-sea-config sea/config.json

TARGET_BIN_NAME="app"

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

BLOB="sea/app.bundle.blob"

cp sea/run.sh bin/app.sh
chmod +x bin/app.sh

$POSTJECT_BIN "${TARGET_DARWIN_ARM64}" NODE_SEA_BLOB ${BLOB} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA
$SIGN_ADD_BIN "${TARGET_DARWIN_ARM64}"
$POSTJECT_BIN "${TARGET_DARWIN_X64}" NODE_SEA_BLOB ${BLOB} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA
$SIGN_ADD_BIN "${TARGET_DARWIN_X64}"

$POSTJECT_BIN "${TARGET_LINUX_ARM64}" NODE_SEA_BLOB ${BLOB} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
$POSTJECT_BIN "${TARGET_LINUX_X64}" NODE_SEA_BLOB ${BLOB} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

#$POSTJECT_BIN "${TARGET_WIN_X64}" NODE_SEA_BLOB ${BLOB} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
#$POSTJECT_BIN "${TARGET_WIN_ARM64}" NODE_SEA_BLOB ${BLOB} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
