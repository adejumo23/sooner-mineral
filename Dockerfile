# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG API_BASE_URL
ARG REACT_APP_ARCGIS_API_KEY
ARG GEMINI_API_KEY

# Set environment variables for the build process
ENV API_BASE_URL=$API_BASE_URL
ENV REACT_APP_ARCGIS_API_KEY=$REACT_APP_ARCGIS_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Run the database dump
# RUN npm run dump:deploy database/full-db-dump.sql database/production-config.json

# Build the application with increased memory
# RUN npm run build
# set DOCKER_BUILDKIT=true
RUN --mount=type=cache,target=/app/node_modules/.cache npm run build


# Install serve to run the built app
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"] 