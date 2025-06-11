#!/usr/bin/env sh

SCRIPT_DIR=$PWD
#$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

sh "${SCRIPT_DIR}/sea/install-esbuild.sh"

sh "${SCRIPT_DIR}/sea/install-nodejs.sh"
