# Build context is the REPOSITORY ROOT, not apps/web: @leak/sdk-lite is a workspace
# package, so the whole pnpm tree has to be present to install it.
#   docker build -f apps/web/Dockerfile -t leak-web:dev .
FROM node:22-alpine AS build
# Matches "packageManager" in the root package.json and lockfileVersion 9.0.
RUN npm install -g pnpm@9.0.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
# The "..." suffix tells turbo to build the dependency tree (@leak/sdk-lite) first.
RUN pnpm exec turbo run build --filter=@leak/web...
RUN test -f /repo/apps/web/dist/index.html
# public/runtime/config.json is a fixture for `pnpm dev`, and vite copies it into dist.
# Leaving it in the image is a trap: the first time the `runtime` volume mounts empty,
# Docker copies the image directory's contents into it, so a dev config with factory
# 0x000…0 lands in the shared volume and the web app silently points at nothing.
# Delete the file, keep the directory.
RUN rm -f /repo/apps/web/dist/runtime/*.json

FROM nginx:1.31-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
# The `runtime` volume mounts over this path. The directory must already exist so
# nginx starts even when nothing is mounted.
RUN mkdir -p /usr/share/nginx/html/runtime
EXPOSE 80
