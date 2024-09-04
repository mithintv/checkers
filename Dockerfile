# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=20.6.1

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

# Set the working directory inside the container
WORKDIR /usr/src/app/server

# Copy the shared folder
COPY ./shared /usr/src/app/shared

# Copy the project folder
COPY ./server /usr/src/app/server

# Define build-time arguments
ARG DB_URI
ARG SECRET_KEY
ARG SALT_ROUNDS

# Set environment variables for the final image
ENV DB_URI=$DB_URI
ENV SECRET_KEY=$SECRET_KEY
ENV SALT_ROUNDS=$SALT_ROUNDS

# Install curl
RUN apk add --no-cache curl

# Install build tools including make, g++, and python
RUN apk add --no-cache python3 py3-pip make g++ && \
    npm install -g typescript

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=server/package.json,target=package.json \
    --mount=type=bind,source=server/package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# Run the build command
RUN npm run build

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 5041

# Run the application.
CMD node dist/server/src/index.js
