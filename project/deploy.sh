#!/bin/bash

# README Application Deployment Script
# Usage: ./deploy.sh [build|transfer|deploy|restart|logs]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VDS_HOST="${VDS_HOST:-user@your-vds-ip}"
VDS_DIR="${VDS_DIR:-/opt/readme}"

function build_images() {
    echo "🔨 Building Docker images..."

    cd "$PROJECT_DIR"

    echo "Building User service..."
    npx nx run user:buildImage

    echo "Building Post service..."
    npx nx run post:buildImage

    echo "Building Notification service..."
    npx nx run notification:buildImage

    echo "Building File storage service..."
    npx nx run file-storage:buildImage

    echo "Building API Gateway..."
    npx nx run api-gateway:build
    docker build -f apps/api-gateway/Dockerfile -t readme.api-gateway .

    echo "✅ All images built successfully!"
}

function save_images() {
    echo "💾 Saving images to tar files..."

    mkdir -p "$PROJECT_DIR/dist/images"
    cd "$PROJECT_DIR/dist/images"

    docker save readme.user:latest | gzip > readme.user.tar.gz
    docker save readme.post:latest | gzip > readme.post.tar.gz
    docker save readme.notification:latest | gzip > readme.notification.tar.gz
    docker save readme.api-gateway:latest | gzip > readme.api-gateway.tar.gz
    docker save readme.file-storage:latest | gzip > readme.file-storage.tar.gz

    echo "✅ Images saved to dist/images/"
}

function transfer_to_vds() {
    echo "📤 Transferring to VDS..."

    if [ -z "$VDS_HOST" ] || [ "$VDS_HOST" = "user@your-vds-ip" ]; then
        echo "❌ Error: Please set VDS_HOST environment variable"
        echo "Example: export VDS_HOST=user@192.168.1.100"
        exit 1
    fi

    # Create directory on VDS
    ssh "$VDS_HOST" "mkdir -p $VDS_DIR"

    # Transfer images
    echo "Transferring images..."
    scp "$PROJECT_DIR/dist/images/"*.tar.gz "$VDS_HOST:$VDS_DIR/"

    # Transfer compose files
    echo "Transferring configuration..."
    scp "$PROJECT_DIR/docker-compose.production.yml" "$VDS_HOST:$VDS_DIR/"
    scp "$PROJECT_DIR/.env.production" "$VDS_HOST:$VDS_DIR/"

    echo "✅ Transfer complete!"
}

function deploy_on_vds() {
    echo "🚀 Deploying on VDS..."

    if [ -z "$VDS_HOST" ] || [ "$VDS_HOST" = "user@your-vds-ip" ]; then
        echo "❌ Error: Please set VDS_HOST environment variable"
        exit 1
    fi

    ssh "$VDS_HOST" << 'EOF'
cd /opt/readme

# Load images
echo "Loading Docker images..."
for img in *.tar.gz; do
    echo "Loading $img..."
    docker load < "$img"
done

# Start services
echo "Starting services..."
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Show status
echo ""
echo "📊 Service Status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "✅ Deployment complete!"
echo "View logs with: docker compose -f docker-compose.production.yml logs -f"
EOF
}

function restart_services() {
    echo "🔄 Restarting services on VDS..."

    ssh "$VDS_HOST" << 'EOF'
cd /opt/readme
docker compose -f docker-compose.production.yml restart
docker compose -f docker-compose.production.yml ps
EOF

    echo "✅ Services restarted!"
}

function view_logs() {
    echo "📋 Viewing logs..."

    ssh -t "$VDS_HOST" << 'EOF'
cd /opt/readme
docker compose -f docker-compose.production.yml logs -f --tail=100
EOF
}

function cleanup() {
    echo "🧹 Cleaning up local build artifacts..."
    rm -rf "$PROJECT_DIR/dist/images"/*.tar.gz
    echo "✅ Cleanup complete!"
}

# Main script
case "${1:-}" in
    build)
        build_images
        ;;
    save)
        save_images
        ;;
    transfer)
        save_images
        transfer_to_vds
        ;;
    deploy)
        deploy_on_vds
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs
        ;;
    full)
        build_images
        save_images
        transfer_to_vds
        deploy_on_vds
        cleanup
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "README Application Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  build      - Build all Docker images locally"
        echo "  save       - Save images to tar files"
        echo "  transfer   - Transfer images and config to VDS"
        echo "  deploy     - Deploy on VDS (load images and start)"
        echo "  restart    - Restart services on VDS"
        echo "  logs       - View logs from VDS"
        echo "  full       - Complete deployment (build + transfer + deploy)"
        echo "  cleanup    - Remove local tar files"
        echo ""
        echo "Environment variables:"
        echo "  VDS_HOST   - SSH connection string (user@ip)"
        echo "  VDS_DIR    - Directory on VDS (default: /opt/readme)"
        echo ""
        echo "Example:"
        echo "  export VDS_HOST=root@192.168.1.100"
        echo "  $0 full"
        ;;
esac
