#!/usr/bin/env sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
BIN_NAME="node"
ARGS="$@"

export NODE_OPTIONS="--experimental-sqlite --disable-warning=ExperimentalWarning"

case $(uname -s) in
    Linux)
      case $(uname -m) in
        aarch64)
            ${SCRIPT_DIR}/deps/nodejs/linux/arm64/${BIN_NAME} ${ARGS}
          ;;
        x64)
            ${SCRIPT_DIR}/deps/nodejs/linux/x64/${BIN_NAME} ${ARGS}
          ;;
        *) echo "unsopported architecture"; exit 99; ;;
      esac
    ;;
    Darwin)
      case $(uname -m) in
          arm64)
            ${SCRIPT_DIR}/deps/nodejs/darwin/arm64/${BIN_NAME} ${ARGS}
          ;;
          x64)
            ${SCRIPT_DIR}/deps/nodejs/darwin/arm64/${BIN_NAME} ${ARGS}
          ;;
          *) echo "unsopported architecture"; exit 99; ;;
        esac
        ;;
    *) echo "unsopported architecture"; exit 99; ;;
esac
