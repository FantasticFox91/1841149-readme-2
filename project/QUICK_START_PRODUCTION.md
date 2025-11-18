# Quick Start - Production Deployment

This is a simplified guide for deploying to production VDS.

## Prerequisites

- VDS with Ubuntu 22.04 (4GB+ RAM)
- Docker & Docker Compose installed on VDS
- SSH access to VDS
- Domain name (optional)

## One-Command Deployment

### Step 1: Setup Environment Variable

```bash
export VDS_HOST=user@your-vds-ip
```

### Step 2: Deploy Everything

```bash
./deploy.sh full
```

This will:
1. Build all Docker images
2. Save them to tar files
3. Transfer to VDS
4. Load images and start services

## Manual Deployment

### 1. Build Images Locally

```bash
./deploy.sh build
```

### 2. Transfer to VDS

```bash
./deploy.sh save
./deploy.sh transfer
```

### 3. Deploy on VDS

```bash
./deploy.sh deploy
```

## Post-Deployment

### View Logs

```bash
./deploy.sh logs
```

Or SSH to VDS:

```bash
ssh your-vds
cd /opt/readme
docker compose -f docker-compose.production.yml logs -f
```

### Check Service Status

```bash
ssh your-vds
cd /opt/readme
docker compose -f docker-compose.production.yml ps
```

### Restart Services

```bash
./deploy.sh restart
```

## Setup Nginx (One-time)

SSH to your VDS and run:

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo tee /etc/nginx/sites-available/readme <<'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/readme /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Setup SSL (Optional)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Important Security Steps

1. **Update passwords in `/opt/readme/.env.production`:**

```bash
ssh your-vds
nano /opt/readme/.env.production
```

Generate strong passwords:

```bash
openssl rand -base64 32  # Copy for MONGO_PASSWORD
openssl rand -base64 32  # Copy for POSTGRES_PASSWORD
openssl rand -base64 32  # Copy for RABBIT_PASSWORD
openssl rand -base64 32  # Copy for JWT_ACCESS_SECRET
openssl rand -base64 32  # Copy for JWT_REFRESH_SECRET
```

2. **Restart after changing passwords:**

```bash
cd /opt/readme
docker compose -f docker-compose.production.yml restart
```

## Accessing Your Application

- **API Gateway:** `http://your-vds-ip/api` or `https://your-domain.com/api`
- **API Docs:** `http://your-vds-ip/api/spec`

## Quick Commands Reference

| Command | Description |
|---------|-------------|
| `./deploy.sh build` | Build all images |
| `./deploy.sh transfer` | Transfer to VDS |
| `./deploy.sh deploy` | Deploy on VDS |
| `./deploy.sh full` | Complete deployment |
| `./deploy.sh restart` | Restart services |
| `./deploy.sh logs` | View logs |

## Architecture

```
Internet
   ↓
Nginx :80/:443
   ↓
API Gateway :3000
   ↓
┌──────────┬───────────┬─────────────┐
↓          ↓           ↓             ↓
User:3001  Post:3002  Notification  Files:3003
           :3004
↓          ↓           ↓
MongoDB    PostgreSQL  MongoDB

All services connect to shared RabbitMQ
```

## Troubleshooting

**Services not starting?**

```bash
ssh your-vds
cd /opt/readme
docker compose -f docker-compose.production.yml logs
```

**Can't connect to API?**

```bash
# Check if Nginx is running
sudo systemctl status nginx

# Check if containers are running
docker ps

# Check if port 3000 is listening
netstat -tuln | grep 3000
```

**RabbitMQ connection issues?**

```bash
# Check RabbitMQ logs
docker logs readme.rabbitmq

# Check if services can reach RabbitMQ
docker exec readme.user.app ping rabbitmq
docker exec readme.post.app ping rabbitmq
```

## Updating Application

```bash
# 1. Build new version locally
./deploy.sh build

# 2. Transfer and deploy
./deploy.sh transfer
./deploy.sh deploy
```

## Backup

Create backup script on VDS:

```bash
ssh your-vds
sudo tee /opt/readme/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backup/readme-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# MongoDB backups
docker exec readme.user.db mongodump --out /tmp/backup
docker cp readme.user.db:/tmp/backup $BACKUP_DIR/mongo-user

docker exec readme.notification.db mongodump --out /tmp/backup
docker cp readme.notification.db:/tmp/backup $BACKUP_DIR/mongo-notification

# PostgreSQL backup
docker exec readme.post.db pg_dump -U admin readme_blog > $BACKUP_DIR/postgres.sql

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR
EOF

chmod +x /opt/readme/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/readme/backup.sh
```

---

**That's it!** Your application should now be running in production. 🚀

For detailed documentation, see [DEPLOYMENT.md](DEPLOYMENT.md)
