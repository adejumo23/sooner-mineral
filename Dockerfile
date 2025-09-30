# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG API_BASE_URL
ARG REACT_APP_ARCGIS_API_KEY

# Set environment variables for the build process
ENV API_BASE_URL=$API_BASE_URL
ENV REACT_APP_ARCGIS_API_KEY=$REACT_APP_ARCGIS_API_KEY

# Install all dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm install --silent

# Build the application with optimizations
RUN --mount=type=cache,target=/app/node_modules/.cache \
    --mount=type=cache,target=/app/dist \
    npm run build


# Install serve to run the built app
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"] 