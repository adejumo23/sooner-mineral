# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --silent

# Copy source code
COPY . .

# Accept build arguments for environment variables
ARG API_BASE_URL
ARG REACT_APP_ARCGIS_API_KEY
ARG DB_HOST
ARG DB_PORT
ARG MYSQL_USER
ARG MYSQL_PASSWORD
ARG MYSQL_DATABASE

# Set environment variables for the build process
ENV API_BASE_URL=$API_BASE_URL
ENV REACT_APP_ARCGIS_API_KEY=$REACT_APP_ARCGIS_API_KEY
ENV DB_HOST=$DB_HOST
ENV DB_PORT=$DB_PORT
ENV MYSQL_USER=$MYSQL_USER
ENV MYSQL_PASSWORD=$MYSQL_PASSWORD
ENV MYSQL_DATABASE=$MYSQL_DATABASE
ENV NODE_ENV=production

# Build the application with optimizations
RUN --mount=type=cache,target=/app/node_modules/.cache \
    npm run build

# Debug: List the contents of the dist folder
RUN ls -la dist/

# Install serve to run the built app
RUN npm install -g serve

# Create uploads directory for API
RUN mkdir -p uploads/imports

# Expose ports for both frontend and backend
EXPOSE 3050 3051

# Start both frontend and backend
CMD ["sh", "-c", "serve -s dist -l 3050 & node server-with-db.js"] 