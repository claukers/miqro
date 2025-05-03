#!/usr/bin/env sh

ARGS="$@"

case $(uname -s) in
    Linux)
        echo "signing bin disabled on linux"
    ;;
    Darwin)
      case $(uname -m) in
          arm64)
            codesign --sign - ${ARGS}
          ;;
          x64)
            codesign --sign - ${ARGS}
          ;;
          *) echo "unsopported architecture"; exit 99; ;;
        esac
        ;;
    *) echo "unsopported architecture";
    ;;
esac
