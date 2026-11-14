# Use official Node.js 18 Alpine image for build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .
ARG VITE_REACT_APP_BASE_URL=/api/v1
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_FACEBOOK_APP_ID
ARG VITE_LINKEDIN_CLIENT_ID
ARG VITE_LARAVEL_BASE_URL
ARG VITE_PLAN_API_BASE_URL
ARG VITE_PHP_SITE_URL
ENV VITE_REACT_APP_BASE_URL=$VITE_REACT_APP_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_FACEBOOK_APP_ID=$VITE_FACEBOOK_APP_ID
ENV VITE_LINKEDIN_CLIENT_ID=$VITE_LINKEDIN_CLIENT_ID
ENV VITE_LARAVEL_BASE_URL=$VITE_LARAVEL_BASE_URL
ENV VITE_PLAN_API_BASE_URL=$VITE_PLAN_API_BASE_URL
ENV VITE_PHP_SITE_URL=$VITE_PHP_SITE_URL

RUN npm run build

# Use nginx to serve the built files
FROM docker.io/nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
