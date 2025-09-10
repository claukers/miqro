#!/usr/bin/env sh

TARGET="${PWD}/sea/deps/nodejs"
VERSION="24.7.0"

if [ -d "$TARGET" ]; then
  echo "$TARGET already exists exist."
else
  echo $VERSION > sea/node.version.tag
  rm -Rf /tmp/node-download-tmp/
  mkdir -p /tmp/node-download-tmp

  cd /tmp/node-download-tmp

  curl https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-darwin-arm64.tar.gz -o node-darwin-arm64.tar.gz
  curl https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-darwin-x64.tar.gz -o node-darwin-x64.tar.gz

  curl https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-linux-x64.tar.gz -o node-linux-x64.tar.gz
  curl https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-linux-arm64.tar.gz -o node-linux-arm64.tar.gz

  #curl https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-win-arm64.zip -o node-win-arm64.zip
  #curl https://nodejs.org/dist/v${VERSION}/node-v${VERSION}-win-x64.zip -o node-win-x64.zip

  tar -xvf node-darwin-arm64.tar.gz
  tar -xvf node-darwin-x64.tar.gz

  tar -xvf node-linux-x64.tar.gz
  tar -xvf node-linux-arm64.tar.gz

  #unzip node-win-arm64.zip
  #unzip node-win-x64.zip

  mkdir -p $TARGET

  mkdir -p "${TARGET}/darwin/arm64/"
  cp "node-v${VERSION}-darwin-arm64/bin/node" "${TARGET}/darwin/arm64/node"
  mkdir -p "${TARGET}/darwin/x64"
  cp "node-v${VERSION}-darwin-x64/bin/node" "${TARGET}/darwin/x64/node"

  mkdir -p "${TARGET}/linux/arm64"
  cp "node-v${VERSION}-linux-arm64/bin/node" "${TARGET}/linux/arm64/node"
  mkdir -p "${TARGET}/linux/x64"
  cp "node-v${VERSION}-linux-x64/bin/node" "${TARGET}/linux/x64/node"

  #mkdir -p "${TARGET}/win/arm64"
  #cp "node-v${VERSION}-win-arm64/node.exe" "${TARGET}/win/arm64/node.exe"
  #mkdir -p "${TARGET}/win/x64"
  #cp "node-v${VERSION}-win-x64/node.exe" "${TARGET}/win/x64/node.exe"
fi
