# Development Dockerfile for Vite React frontend
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactjs -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R reactjs:nodejs /usr/src/app
USER reactjs

# Expose Vite's default port
EXPOSE 5173

# Set environment to development
ENV NODE_ENV=development

# Start the Vite development server
CMD ["npm", "run", "dev", "--", "--host"]