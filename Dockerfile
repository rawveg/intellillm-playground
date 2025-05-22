# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies required for node-gyp, if needed
RUN apk add --no-cache python3 make g++

# Copy package files for better layer caching
COPY package.json package-lock.json ./

# Install dependencies with clean npm cache to save space
RUN npm ci --legacy-peer-deps --production=false && \
    npm cache clean --force

# Copy only necessary files
COPY src ./src
COPY tsconfig.json ./
COPY next-env.d.ts ./
COPY postcss.config.js ./
COPY tailwind.config.js ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next-env.d.ts ./

# Install only production dependencies
RUN npm ci --legacy-peer-deps --production && \
    npm cache clean --force

# Create prompts directory
RUN mkdir -p /app/prompts

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
