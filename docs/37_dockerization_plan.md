# Dockerization Plan
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This document outlines the containerization strategy for SmartLibrary AI, configuring multi-stage builds and container orchestrations.

---

### 1. Dockerfile Specifications

#### 1.1 Backend Container (`backend/Dockerfile`)
Uses a multi-stage approach to compile TypeScript and prune development dependencies to minimize the final image footprint.
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/app.js"]
```

#### 1.2 Frontend Container (`frontend/Dockerfile`)
Compiles the React production build and serves it via Nginx.
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 2. Multi-Container Orchestration (`docker-compose.yml`)

The production composition bundles the frontend, backend, MongoDB database, and EMQX MQTT broker on an isolated bridge network.

```yaml
version: '3.8'

services:
  database:
    image: mongo:6.0-jammy
    container_name: smartlibrary_db
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - library_net

  mqtt_broker:
    image: emqx/emqx:5.1.0
    container_name: smartlibrary_broker
    restart: unless-stopped
    ports:
      - "1883:1883" # MQTT Port
      - "8883:8883" # Secure MQTT Port
      - "18083:18083" # EMQX Dashboard
    volumes:
      - emqx_data:/opt/emqx/data
    networks:
      - library_net

  backend:
    build: ./backend
    container_name: smartlibrary_api
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://database:27017/smartlibrary
      - MQTT_BROKER_URL=mqtt://mqtt_broker:1883
      - PORT=5000
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - database
      - mqtt_broker
    networks:
      - library_net

  frontend:
    build: ./frontend
    container_name: smartlibrary_web
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - library_net

volumes:
  mongo_data:
  emqx_data:

networks:
  library_net:
    driver: bridge
```
*   **Security feature:** `database` port mapping `27017:27017` is optionally removed in high-security configurations so only the `backend` can reach it internally within `library_net`.
