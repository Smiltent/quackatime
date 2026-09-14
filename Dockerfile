
FROM denoland/deno:2.1.4

WORKDIR /app
COPY deno.json deno.lock* ./

RUN deno install
COPY . .

EXPOSE 3000

CMD ["run", "--env-file", "--allow-net", "--allow-read", "--allow-env", "--allow-sys", "--allow-ffi", "index.ts"]