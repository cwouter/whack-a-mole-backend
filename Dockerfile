# Build stage
FROM node:24-alpine3.1 AS builder

WORKDIR /app
COPY package*.json ./

RUN npm ci
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Runtime stage
FROM node:24-alpine3.1

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/server.js"]
