# Build with `pnpm build` on the host. Only the bundle and runtime enter the image.
FROM docker.io/library/node:26.12.1-bookworm-slim AS dependencies
WORKDIR /app
RUN npm install --global pnpm@12.6.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM docker.io/library/node:26.12.1-bookworm-slim
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY src/server.js ./src/server.js
COPY dist/ ./dist/
USER node
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/server.js"]
