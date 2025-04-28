# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Create Next.js app with our specific configuration
COPY . .

# Install dependencies and build
RUN npm install --legacy-peer-deps
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create prompts directory
RUN mkdir -p /app/prompts

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
