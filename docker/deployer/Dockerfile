# Build context is the REPOSITORY ROOT:
#   docker build -f docker/deployer/Dockerfile -t leak-deployer:dev .
#
# Two stages, because coins-deployments' foundry.toml declares `libs = ["node_modules"]`:
# Solidity dependencies come from pnpm, not `forge install`. Install with the official
# node image and carry /repo across to the foundry image, so nothing is assumed about
# which package manager the foundry image ships.
FROM node:22-alpine AS deps
RUN npm install -g pnpm@9.0.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM ghcr.io/foundry-rs/foundry:v1.3.5
USER root
WORKDIR /repo
# The path stays /repo, so pnpm's symlinks still resolve.
COPY --from=deps /repo /repo
# Compile ahead of time so the first run does not stall while anvil is already up.
RUN cd /repo/packages/coins-deployments && forge build
COPY docker/deployer/deploy-local.sh /usr/local/bin/deploy-local.sh
RUN chmod +x /usr/local/bin/deploy-local.sh
ENTRYPOINT ["/usr/local/bin/deploy-local.sh"]
