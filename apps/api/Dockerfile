# Build context is the REPOSITORY ROOT:
#   docker build -f apps/api/Dockerfile -t leak-api:dev .
FROM node:22-alpine
RUN npm install -g pnpm@9.0.0
WORKDIR /repo
COPY . .
# devDependencies are required: the API runs TypeScript directly through tsx — its
# `build` script is `tsc --noEmit` and emits no JS — and migrations need drizzle-kit.
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @leak/api exec tsc --noEmit
WORKDIR /repo/apps/api
EXPOSE 8787
# Migrate on every start: the tables must exist before the first request arrives.
CMD ["sh", "-c", "pnpm exec drizzle-kit migrate && pnpm exec tsx src/index.ts"]
