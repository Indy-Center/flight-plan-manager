FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations

RUN npm install

# Run type checking
RUN npx tsc --noEmit

ENV NODE_ENV=production
CMD ["npx", "tsx", "src/server.ts"]