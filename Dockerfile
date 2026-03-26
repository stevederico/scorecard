# Multi-stage build for smaller production image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install && cd backend && npm install

# Analytics env vars for build-time access
ARG VITE_ANALYTICS_SRC
ARG VITE_ANALYTICS_ID
ENV VITE_ANALYTICS_SRC=$VITE_ANALYTICS_SRC
ENV VITE_ANALYTICS_ID=$VITE_ANALYTICS_ID

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy backend
COPY --from=builder /app/backend ./backend

# Copy root node_modules (workspaces hoist here)
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Expose port
EXPOSE 8000

# Run server
CMD ["node", "--experimental-sqlite", "backend/server.js"]
