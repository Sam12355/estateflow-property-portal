# Container build for the playbook feature.
#
# Present because the required-checks list includes a container build, and because a
# repository that lists a check it cannot run should either run it or say so. This one can
# be run: `docker build -t ai-engineering-playbook .`
#
# Multi-stage, so the runtime image has no compiler, no source and no dev dependencies.

FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Manifests first, so this layer is cached until a dependency actually changes and a
# code-only edit does not reinstall everything.
COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN pnpm exec tsc -p tsconfig.json \
 && pnpm prune --prod

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache tini

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./

# Running as root inside a container is a default nobody should accept.
USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "-e", "const e=require('./dist/escalation');console.log('escalation module loaded:',Object.keys(e).join(', '))"]
