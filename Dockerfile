#1 instal/compil des deps
FROM node:24-slim AS deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

#2 image
FROM node:24-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

RUN mkdir -p data && chown node:node data
USER node

EXPOSE 3000
CMD ["node", "src/server.js"]
