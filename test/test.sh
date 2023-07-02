#!/bin/sh

. ./.env.local

docker build -t foundry-auto-release-test .
docker run --workdir /github/workspace --rm -e NODE_ENV=development -v $(pwd):/github/workspace foundry-auto-release-test "test/module.json" "686" "$USERNAME" "$PASSWORD"