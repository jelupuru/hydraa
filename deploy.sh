#!/bin/bash

# Hydraa Deployment Script for Azure VM
# Run this script on your Azure VM to deploy the application

set -e

echo "🚀 Starting Hydraa deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/azureuser/hydraa"
SERVICE_NAME="hydraa"
DOMAIN_NAME=""  # Set your domain name here

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${BLUE}[WARNING]${NC} $1"
}

# Check if running as correct user
if [ "$USER" != "azureuser" ]; then
    print_error "Please run this script as azureuser"
    exit 1
fi

# Check if in correct directory
if [ ! -f "$APP_DIR/docker-compose.prod.yml" ]; then
    print_error "Please run this script from the hydraa directory"
    print_error "Expected: $APP_DIR"
    print_error "Current: $(pwd)"
    exit 1
fi

cd "$APP_DIR"

# Step 1: Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_warning "nginx is not installed. Installing nginx..."
    sudo apt update
    sudo apt install nginx -y
fi

print_status "Prerequisites check completed ✅"

# Step 2: Create production environment file
print_status "Setting up environment configuration..."

if [ ! -f ".env.production" ]; then
    if [ -f ".env" ]; then
        cp .env .env.production
        print_status "Copied .env to .env.production"
    else
        print_error ".env file not found. Please create .env.production manually."
        exit 1
    fi
fi

# Prompt for domain name if not set
if [ -z "$DOMAIN_NAME" ]; then
    read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME
    if [ -z "$DOMAIN_NAME" ]; then
        print_warning "No domain name provided. Using localhost configuration."
        DOMAIN_NAME="localhost"
    fi
fi

# Update environment file with production values
print_status "Updating environment configuration for domain: $DOMAIN_NAME"
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN_NAME|g" .env.production
sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://$DOMAIN_NAME|g" .env.production
sed -i "s|SITE_URL=.*|SITE_URL=https://$DOMAIN_NAME|g" .env.production

# Step 3: Build and deploy application
print_status "Building and deploying application..."

# Stop existing containers
docker-compose -f docker-compose.prod.yml --env-file .env.production down 2>/dev/null || true

# Build and start new containers
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_error "Application failed to start. Check logs with: docker-compose logs"
    exit 1
fi

print_status "Application deployed successfully ✅"

# Step 4: Configure nginx
print_status "Configuring nginx..."

# Backup existing nginx config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Copy nginx configuration
if [ -f "nginx.conf" ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/hydraa
    
    # Update domain name in nginx config
    sudo sed -i "s/yourdomain.com/$DOMAIN_NAME/g" /etc/nginx/sites-available/hydraa
    
    # Disable default site and enable hydraa site
    sudo unlink /etc/nginx/sites-enabled/default 2>/dev/null || true
    sudo ln -sf /etc/nginx/sites-available/hydraa /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    if sudo nginx -t; then
        sudo systemctl restart nginx
        print_status "nginx configured successfully ✅"
    else
        print_error "nginx configuration error. Please check the configuration."
        exit 1
    fi
else
    print_warning "nginx.conf not found. Please configure nginx manually."
fi

# Step 5: Setup systemd service
print_status "Setting up systemd service..."

if [ -f "hydraa.service" ]; then
    sudo cp hydraa.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable hydraa.service
    print_status "Systemd service configured ✅"
else
    print_warning "hydraa.service not found. Skipping systemd setup."
fi

# Step 6: Setup SSL (if domain is not localhost)
if [ "$DOMAIN_NAME" != "localhost" ]; then
    print_status "Setting up SSL certificate..."
    
    # Check if certbot is installed
    if command -v certbot &> /dev/null; then
        print_status "Obtaining SSL certificate for $DOMAIN_NAME"
        
        # Obtain certificate
        if sudo certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email admin@"$DOMAIN_NAME" --redirect; then
            print_status "SSL certificate configured successfully ✅"
        else
            print_warning "SSL certificate setup failed. You can run 'sudo certbot --nginx -d $DOMAIN_NAME' manually later."
        fi
    else
        print_warning "certbot not found. Please install certbot to setup SSL."
        print_status "Install with: sudo apt install certbot python3-certbot-nginx"
    fi
fi

# Step 7: Setup firewall
print_status "Configuring firewall..."

if command -v ufw &> /dev/null; then
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
    print_status "Firewall configured ✅"
fi

# Step 8: Final checks
print_status "Performing final checks..."

# Check if app is responding
sleep 10
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Application is responding ✅"
else
    print_warning "Application may not be responding on localhost:3000"
fi

# Display status
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "   • Application URL: https://$DOMAIN_NAME"
echo "   • Database Admin: http://$DOMAIN_NAME/adminer"
echo "   • Application Status: $(docker-compose -f docker-compose.prod.yml ps --services --filter status=running | wc -l)/3 services running"
echo ""
echo "🔧 Useful Commands:"
echo "   • View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   • Restart app: sudo systemctl restart hydraa"
echo "   • Update app: ./deploy.sh"
echo ""
echo "📝 Next Steps:"
echo "   1. Point your domain DNS to this server's IP: $(curl -s ifconfig.me)"
if [ "$DOMAIN_NAME" != "localhost" ]; then
    echo "   2. Wait for DNS propagation (up to 24 hours)"
    echo "   3. SSL certificate will be automatically renewed"
fi
echo ""
print_status "Deployment script completed! 🚀"