# Stage 1: Builder
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma Client and Build Vite + TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 2: Runner (Production)
FROM node:18-alpine AS runner

WORKDIR /app

# Configure non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Install PM2 globally
RUN npm install -g pm2

# Copy only the necessary files from the builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma

# Chown all files to the non-root user
RUN chown -R nodeuser:nodejs /app

USER nodeuser

# Expose the API port
EXPOSE 3001

# Command to run the application using PM2
CMD ["pm2-runtime", "start", "npm", "--name", "zapbulk", "--", "start"]
