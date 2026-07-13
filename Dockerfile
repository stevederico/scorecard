FROM node:24-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm install && cd backend && npm install

COPY . .

# Vite bakes VITE_* env at build time; Railway build vars must be declared as ARG to reach the build.
ARG VITE_DOTTIE_ID
ARG VITE_DOTTIE_SRC
ENV VITE_DOTTIE_ID=$VITE_DOTTIE_ID
ENV VITE_DOTTIE_SRC=$VITE_DOTTIE_SRC

RUN npm run build

FROM node:24-alpine

RUN apk add --no-cache libstdc++

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend

RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && cd backend && npm install --omit=dev \
    && apk del .build-deps

RUN chown -R node:node /app/backend

USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/api/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

WORKDIR /app/backend
CMD ["node", "server.ts"]
