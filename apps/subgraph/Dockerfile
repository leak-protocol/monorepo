# Build context is the REPOSITORY ROOT:
#   docker build -f apps/subgraph/Dockerfile -t leak-subgraph:dev .
FROM node:22-alpine
RUN npm install -g pnpm@9.0.0
WORKDIR /repo
COPY . .
# graph-cli is a dependency of apps/subgraph. Installing it here avoids an npx
# download at run time, which would stall the whole stack on a bad network.
RUN pnpm install --frozen-lockfile
COPY docker/subgraph/deploy-subgraph.sh /usr/local/bin/deploy-subgraph.sh
RUN chmod +x /usr/local/bin/deploy-subgraph.sh
WORKDIR /repo/apps/subgraph
ENTRYPOINT ["/usr/local/bin/deploy-subgraph.sh"]
