# Multi-stage Dockerfile for static React Vite build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN mkdir -p /opt/static_app && cp -R dist/* /opt/static_app/

FROM scratch
COPY --from=build /opt/static_app /opt/static_app
