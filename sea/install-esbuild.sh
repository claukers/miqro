#!/usr/bin/env sh

TARGET="${PWD}/sea/deps/esbuild"
VERSION="0.25.5"

if [ -d "$TARGET" ]; then
  echo "$TARGET already exists exist."
else
  echo $VERSION > sea/esbuild.version.tag
  rm -Rf /tmp/node-download-tmp/
  mkdir -p /tmp/node-download-tmp

  cd /tmp/node-download-tmp

  curl "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-${VERSION}.tgz" -o esbuild-darwin-arm64.tgz
  curl "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-${VERSION}.tgz" -o esbuild-darwin-x64.tgz

  curl "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-${VERSION}.tgz" -o esbuild-linux-x64.tgz
  curl "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-${VERSION}.tgz" -o esbuild-linux-arm64.tgz

  #curl "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-${VERSION}.tgz" -o esbuild-win-x64.tgz
  #curl "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-${VERSION}.tgz" -o esbuild-win-arm64.tgz

  mkdir -p esbuild-darwin-arm64
  tar -xvf esbuild-darwin-arm64.tgz -C esbuild-darwin-arm64
  mkdir -p esbuild-darwin-x64
  tar -xvf esbuild-darwin-x64.tgz -C esbuild-darwin-x64

  mkdir -p esbuild-linux-arm64
  tar -xvf esbuild-linux-arm64.tgz -C esbuild-linux-arm64
  mkdir -p esbuild-linux-x64
  tar -xvf esbuild-linux-x64.tgz -C esbuild-linux-x64

  #mkdir -p esbuild-win-arm64
  #tar -xvf esbuild-win-arm64.tgz -C esbuild-win-arm64
  #mkdir -p esbuild-win-x64
  #tar -xvf esbuild-win-x64.tgz -C esbuild-win-x64

  mkdir -p "${TARGET}/darwin/arm64/"
  cp "esbuild-darwin-arm64/package/bin/esbuild" "${TARGET}/darwin/arm64/esbuild"
  mkdir -p "${TARGET}/darwin/x64/"
  cp "esbuild-darwin-x64/package/bin/esbuild" "${TARGET}/darwin/x64/esbuild"

  mkdir -p "${TARGET}/linux/arm64/"
  cp "esbuild-linux-arm64/package/bin/esbuild" "${TARGET}/linux/arm64/esbuild"
  mkdir -p "${TARGET}/linux/x64/"
  cp "esbuild-linux-x64/package/bin/esbuild" "${TARGET}/linux/x64/esbuild"

  #mkdir -p "${TARGET}/win/arm64/"
  #cp "esbuild-win-arm64/package/esbuild.exe" "${TARGET}/win/arm64/esbuild.exe"
  #mkdir -p "${TARGET}/win/x64/"
  #cp "esbuild-win-x64/package/esbuild.exe" "${TARGET}/win/x64/esbuild.exe"
fi
