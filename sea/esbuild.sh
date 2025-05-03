#!/usr/bin/env sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
BIN_NAME="esbuild"
ARGS="$@"

case $(uname -s) in
    Linux)
      case $(uname -m) in
        aarch64)
            ${SCRIPT_DIR}/deps/esbuild/linux/arm64/${BIN_NAME} ${ARGS}
          ;;
        x64)
            ${SCRIPT_DIR}/deps/esbuild/linux/x64/${BIN_NAME} ${ARGS}
          ;;
        *) echo "unsopported architecture"; exit 99; ;;
      esac
    ;;
    Darwin)
      case $(uname -m) in
          arm64)
            ${SCRIPT_DIR}/deps/esbuild/darwin/arm64/${BIN_NAME} ${ARGS}
          ;;
          x64)
            ${SCRIPT_DIR}/deps/esbuild/darwin/arm64/${BIN_NAME} ${ARGS}
          ;;
          *) echo "unsopported architecture"; exit 99; ;;
        esac
        ;;
    *) echo "unsopported architecture"; exit 99; ;;
esac
