FROM node:12-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:12-alpine
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist/ ./dist/
RUN npm ci --only=production
EXPOSE 4000
CMD [ "node", "dist/server.js" ]
