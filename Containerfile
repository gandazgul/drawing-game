# Build the Vite bundle first with `deno task build` on the host. That includes
# the local sibling Caper checkout without sending private drawings to Podman.
FROM docker.io/denoland/deno:2.9.7
WORKDIR /app
COPY src/server.js ./src/server.js
COPY server.lock ./server.lock
RUN deno cache --no-config --lock=server.lock --frozen src/server.js
COPY dist/ ./dist/
USER deno
ENV PORT=8080
EXPOSE 8080
CMD ["run", "--no-config", "--lock=server.lock", "--frozen", "--cached-only", "--allow-net=0.0.0.0:8080", "--allow-read=/app/dist", "--allow-env=PORT", "src/server.js"]
