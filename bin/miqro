#!/usr/bin/env sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
BIN_NAME="miqro"
ARGS="$@"

export NODE_OPTIONS="--disable-warning=ExperimentalWarning"
#export NODE_OPTIONS="--experimental-sqlite --disable-warning=ExperimentalWarning"

case $(uname -s) in
    Linux)
      case $(uname -m) in
        aarch64)
            ${SCRIPT_DIR}/linux-arm64/${BIN_NAME} ${ARGS}
          ;;
        x86_64)
            ${SCRIPT_DIR}/linux-x64/${BIN_NAME} ${ARGS}
          ;;
        *) echo "unsopported architecture"; exit 99; ;;
      esac
    ;;
    Darwin)
      case $(uname -m) in
          arm64)
            ${SCRIPT_DIR}/darwin-arm64/${BIN_NAME} ${ARGS}
          ;;
          x64)
            ${SCRIPT_DIR}/darwin-arm64/${BIN_NAME} ${ARGS}
          ;;
          *) echo "unsopported architecture"; exit 99; ;;
        esac
        ;;
    *) echo "unsopported architecture"; exit 99; ;;
esac
