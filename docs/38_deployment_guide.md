# Deployment Guide
## SmartLibrary AI - IoT Based Smart Library Seat Management System

This guide outlines the steps required to deploy the complete SmartLibrary AI stack onto a fresh Ubuntu Linux Virtual Private Server (VPS).

---

### 1. Prerequisites (Target Server Installation)
Connect to the server via SSH and execute the following commands to install Docker, Docker Compose, and Nginx.

```bash
# Update package definitions
sudo apt update && sudo apt upgrade -y

# Install Docker dependencies
sudo apt install -y curl git apt-transport-https ca-certificates gnupg lsb-release

# Install Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start and enable Docker service
sudo systemctl enable docker --now

# Install Nginx reverse proxy
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

### 2. Project Provisioning & Environment Setup

#### 2.1 Fetch Codebase
```bash
cd /opt
sudo git clone https://github.com/sonall12376/IOT-inspired-Library-management-system.git smartlibrary-ai
cd smartlibrary-ai
```

#### 2.2 Configure Environment Variables
Create the production environment file:
```bash
sudo nano .env
```
Fill in the configuration parameters (adjust secrets accordingly):
```env
# Server configs
PORT=5000
NODE_ENV=production

# Database configs
MONGO_URI=mongodb://database:27017/smartlibrary

# Broker configs
MQTT_BROKER_URL=mqtt://mqtt_broker:1883

# Security keys
JWT_SECRET=super_secret_session_token_key_19283
```

---

### 3. Container Boot-up Execution
Run Docker compose to download base images, compile code sources, and launch system processes:

```bash
# Build and run containers in background mode
sudo docker compose --env-file .env up -d --build

# Verify all containers are running
sudo docker compose ps
```

---

### 4. Reverse Proxy & SSL Configuration
Configure Nginx to map domain requests (e.g. `library.university.edu`) to the internal Docker web interface (Port 80) and REST API (Port 5000).

1.  Create server block configurations:
    ```bash
    sudo nano /etc/nginx/sites-available/smartlibrary
    ```
2.  Add configuration blocks (with WebSocket support):
    ```nginx
    server {
        listen 80;
        server_name library.university.edu;

        # Frontend assets
        location / {
            proxy_pass http://localhost:8080; # Map to Frontend port
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Backend REST API
        location /api/ {
            proxy_pass http://localhost:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket Socket.IO connection
        location /socket.io/ {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
    ```
3.  Activate configuration and link SSL certificates:
    ```bash
    sudo ln -s /etc/nginx/sites-available/smartlibrary /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx

    # Request Let's Encrypt certificates
    sudo certbot --nginx -d library.university.edu
    ```
