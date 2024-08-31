#!/bin/bash
cp dist/index.html index.html.template
set -a && source .env && set +a
envsubst < index.html.template > dist/index.html && rm index.html.template
