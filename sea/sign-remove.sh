#!/usr/bin/env sh

ARGS="$@"

case $(uname -s) in
    Linux)
        echo "signing bin disabled on linux"
    ;;
    Darwin)
      case $(uname -m) in
          arm64)
            codesign --remove-signature ${ARGS}
          ;;
          x64)
            codesign --remove-signature ${ARGS}
          ;;
          *) echo "unsopported architecture"; exit 99; ;;
        esac
        ;;
    *) echo "unsopported architecture";
    ;;
esac
