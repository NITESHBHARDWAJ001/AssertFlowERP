# syntax=docker/dockerfile:1
#
# Three stages: install deps, build (tsc + prisma generate), then a lean
# runtime image. Migrations are NOT run at build time - they run every time
# the container starts, via docker-entrypoint.sh, so a deploy always
# reconciles the database before the API accepts traffic.
#
# Debian-slim (not alpine) on purpose: bcrypt is a native module and
# Prisma's query engine needs libssl - both are more reliable here than
# chasing musl/alpine prebuilt-binary mismatches.

ARG NODE_VERSION=20-slim

##### deps: install exactly what's declared in the lockfile #####
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

##### build: compile TypeScript and generate the Prisma Client #####
FROM node:${NODE_VERSION} AS build
WORKDIR /app
# prisma generate validates that the schema's env("DATABASE_URL") resolves
# to *something* - it never connects, so a placeholder is fine here.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate
RUN npm run build

##### runtime: minimal image that actually ships #####
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma's engine binary links against libssl on Debian-based images.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system assetflow && useradd --system --gid assetflow assetflow

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Bring over the already-generated Prisma Client + query engine from the
# build stage (same base image, so the prebuilt engine binary matches)
# instead of regenerating, since that would need DATABASE_URL again here.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh && chown -R assetflow:assetflow /app

USER assetflow

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
