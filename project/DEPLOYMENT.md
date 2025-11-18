# Production Deployment Guide

This guide explains how to deploy the README microservices application to a VDS (Virtual Dedicated Server).

## Prerequisites

- VDS with Docker and Docker Compose installed
- Domain name (optional, for SSL)
- SSH access to VDS

## Architecture Overview

```
Internet → Nginx (SSL) → API Gateway (3000)
                              ↓
          ┌──────────────────┬─────────────┬──────────────────┐
          ↓                  ↓             ↓                  ↓
    User Service      Post Service   Notification     File Storage
      (3001)            (3002)         (3004)            (3003)
          ↓                  ↓             ↓
    MongoDB (User)    PostgreSQL    MongoDB (Notify)
                           ↓
                      RabbitMQ (shared)
```

## Step 1: Prepare Your VDS

### 1.1 Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose V2
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 1.2 Setup Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 1.3 Create Application Directory

```bash
sudo mkdir -p /opt/readme
sudo chown $USER:$USER /opt/readme
cd /opt/readme
```

## Step 2: Build Docker Images Locally

On your **local development machine**:

```bash
# Navigate to project
cd project

# Build all services
npx nx run user:buildImage
npx nx run post:buildImage
npx nx run notification:buildImage
npx nx run api-gateway:build
docker build -f apps/api-gateway/Dockerfile -t readme.api-gateway .

# Verify images
docker images | grep readme
```

## Step 3: Transfer Images to VDS

### Option A: Save and Transfer (Recommended for private VDS)

```bash
# Save images to tar files
docker save readme.user:latest | gzip > readme.user.tar.gz
docker save readme.post:latest | gzip > readme.post.tar.gz
docker save readme.notification:latest | gzip > readme.notification.tar.gz
docker save readme.api-gateway:latest | gzip > readme.api-gateway.tar.gz

# Transfer to VDS
scp *.tar.gz user@your-vds-ip:/opt/readme/

# On VDS, load images
cd /opt/readme
docker load < readme.user.tar.gz
docker load < readme.post.tar.gz
docker load < readme.notification.tar.gz
docker load < readme.api-gateway.tar.gz

# Clean up tar files
rm *.tar.gz
```

### Option B: Use Docker Registry (Recommended for teams)

```bash
# Tag images
docker tag readme.user:latest your-registry.com/readme.user:latest
docker tag readme.post:latest your-registry.com/readme.post:latest
docker tag readme.notification:latest your-registry.com/readme.notification:latest
docker tag readme.api-gateway:latest your-registry.com/readme.api-gateway:latest

# Push to registry
docker push your-registry.com/readme.user:latest
docker push your-registry.com/readme.post:latest
docker push your-registry.com/readme.notification:latest
docker push your-registry.com/readme.api-gateway:latest

# On VDS, pull images
docker pull your-registry.com/readme.user:latest
docker pull your-registry.com/readme.post:latest
docker pull your-registry.com/readme.notification:latest
docker pull your-registry.com/readme.api-gateway:latest
```

## Step 4: Configure Production Environment

On your VDS:

```bash
cd /opt/readme

# Copy docker-compose and env files
# (Upload these from your local machine)
```

Transfer these files to VDS:
- `docker-compose.production.yml`
- `.env.production`

```bash
# On local machine
scp docker-compose.production.yml user@your-vds-ip:/opt/readme/
scp .env.production user@your-vds-ip:/opt/readme/
```

### 4.1 Update Environment Variables

On VDS, edit `.env.production`:

```bash
nano /opt/readme/.env.production
```

**Generate strong passwords:**

```bash
# Generate strong random passwords
openssl rand -base64 32  # Use for MONGO_PASSWORD
openssl rand -base64 32  # Use for POSTGRES_PASSWORD
openssl rand -base64 32  # Use for RABBIT_PASSWORD
openssl rand -base64 32  # Use for JWT_ACCESS_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET
```

Update `.env.production`:

```env
MONGO_USER=admin
MONGO_PASSWORD=<generated-password-1>

POSTGRES_USER=admin
POSTGRES_PASSWORD=<generated-password-2>

RABBIT_USER=admin
RABBIT_PASSWORD=<generated-password-3>

JWT_ACCESS_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
```

## Step 5: Deploy Application

```bash
cd /opt/readme

# Start all services
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Check status
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f

# Check specific service
docker logs readme.user.app
docker logs readme.post.app
docker logs readme.notification.app
docker logs readme.api-gateway
```

## Step 6: Setup Nginx Reverse Proxy

### 6.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 6.2 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/readme
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size limit
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/readme-access.log;
    error_log /var/log/nginx/readme-error.log;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/readme /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6.3 Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test renewal
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx configuration to use HTTPS.

## Step 7: Database Initialization

### 7.1 Run Prisma Migrations (Post Service)

```bash
# Enter Post service container
docker exec -it readme.post.app sh

# Run migrations
npx prisma migrate deploy --schema ./schema.prisma

# Exit container
exit
```

## Step 8: Monitoring & Maintenance

### 8.1 View Logs

```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker logs -f readme.user.app
docker logs -f readme.post.app
docker logs -f readme.notification.app
docker logs -f readme.api-gateway
docker logs -f readme.rabbitmq

# Last 100 lines
docker logs --tail 100 readme.user.app
```

### 8.2 Check Service Health

```bash
# Check all containers
docker ps

# Check specific service health
docker inspect readme.user.app | grep -A 5 Health
docker inspect readme.post.app | grep -A 5 Health
```

### 8.3 Restart Services

```bash
# Restart all
docker compose -f docker-compose.production.yml restart

# Restart specific service
docker restart readme.user.app
docker restart readme.post.app
docker restart readme.notification.app
```

## Step 9: Backup Strategy

### 9.1 Create Backup Script

```bash
sudo nano /opt/readme/backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/backup/readme-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup MongoDB (User)
docker exec readme.user.db mongodump --authenticationDatabase admin \
  -u admin -p <password> --db readme-user --out /tmp/backup
docker cp readme.user.db:/tmp/backup $BACKUP_DIR/mongo-user
docker exec readme.user.db rm -rf /tmp/backup

# Backup MongoDB (Notification)
docker exec readme.notification.db mongodump --authenticationDatabase admin \
  -u admin -p <password> --db readme-notification --out /tmp/backup
docker cp readme.notification.db:/tmp/backup $BACKUP_DIR/mongo-notification
docker exec readme.notification.db rm -rf /tmp/backup

# Backup PostgreSQL
docker exec readme.post.db pg_dump -U admin readme_blog > $BACKUP_DIR/postgres-post.sql

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Keep only last 7 days
find /backup -name "readme-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

Make executable:

```bash
chmod +x /opt/readme/backup.sh
```

### 9.2 Schedule Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/readme/backup.sh >> /var/log/readme-backup.log 2>&1
```

## Step 10: Update/Deployment Process

### 10.1 Update Application

```bash
# 1. Build new images locally
npx nx run user:buildImage
npx nx run post:buildImage
npx nx run notification:buildImage

# 2. Transfer to VDS (or push to registry)
docker save readme.user:latest | gzip > readme.user.tar.gz
scp readme.user.tar.gz user@your-vds:/opt/readme/

# 3. On VDS, load and restart
cd /opt/readme
docker load < readme.user.tar.gz
docker compose -f docker-compose.production.yml up -d --force-recreate user-service

# 4. Check logs
docker logs -f readme.user.app
```

## Troubleshooting

### Issue: Services can't connect to RabbitMQ

```bash
# Check RabbitMQ is running
docker logs readme.rabbitmq

# Check network connectivity
docker exec readme.user.app ping rabbitmq
docker exec readme.post.app ping rabbitmq

# Check environment variables
docker exec readme.user.app env | grep RABBIT
```

### Issue: Database connection failed

```bash
# Check database is running
docker logs readme.user.db
docker logs readme.post.db

# Check connection from service
docker exec readme.user.app ping mongo-user
docker exec readme.post.app ping postgres-post
```

### Issue: Out of disk space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old images
docker images | grep '<none>' | awk '{print $3}' | xargs docker rmi
```

## Security Checklist

- [ ] Changed all default passwords in `.env.production`
- [ ] Generated strong JWT secrets
- [ ] Enabled UFW firewall
- [ ] Setup SSL/TLS with Let's Encrypt
- [ ] Disabled RabbitMQ management UI in production (or secured it)
- [ ] Disabled database admin UIs (Mongo Express, pgAdmin)
- [ ] Setup automated backups
- [ ] Configured log rotation
- [ ] Limited Docker ports exposure (only API Gateway on port 3000)
- [ ] Setup monitoring/alerts (optional: Prometheus + Grafana)

## Performance Tuning

### For 4GB RAM VDS:

```yaml
# Add to docker-compose.production.yml for each service
services:
  user-service:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### For 8GB+ RAM VDS:

No changes needed, default configuration is fine.

## Monitoring Setup (Optional)

Install Portainer for container management UI:

```bash
docker volume create portainer_data

docker run -d -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce

# Access at: http://your-vds-ip:9000
```

## Support

For issues, check:
1. Service logs: `docker logs <container-name>`
2. Nginx logs: `/var/log/nginx/readme-error.log`
3. System logs: `journalctl -u docker`

---

**Your application is now deployed!** 🚀

Access your API at: `https://your-domain.com/api`
