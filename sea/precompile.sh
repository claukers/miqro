#!/usr/bin/env sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

sh "${SCRIPT_DIR}/install-esbuild.sh"

sh "${SCRIPT_DIR}/install-nodejs.sh"
