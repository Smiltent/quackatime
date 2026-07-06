
FROM oven/bun:latest
WORKDIR /app

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lockb* ./

RUN bun i --frozen-lockfile

COPY . .
EXPOSE 8080

CMD ["bun", "run", "start"]