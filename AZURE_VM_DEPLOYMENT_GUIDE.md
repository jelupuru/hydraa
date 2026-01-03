# Comprehensive Azure VM Deployment Guide for Next.js Application (Without Docker)

This guide provides step-by-step instructions for deploying your Next.js application to an Azure Virtual Machine without using Docker. The application uses PostgreSQL database, Prisma ORM, and requires proper environment configuration.

## Prerequisites

- Azure subscription
- Domain name (optional but recommended for production)
- SSH client (OpenSSH, PuTTY, etc.)
- Git repository access

## 1. Create Azure Virtual Machine

### Option A: Azure Portal

1. **Navigate to Virtual Machines**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Search for "Virtual machines" and click "Create"

2. **Configure Basic Settings**:
   - **Subscription**: Select your subscription
   - **Resource group**: Create new or select existing (e.g., `hydraa-rg`)
   - **Virtual machine name**: `hydraa-vm`
   - **Region**: Choose a region close to your users (e.g., East US, West Europe)
   - **Availability options**: No infrastructure redundancy required
   - **Security type**: Standard
   - **Image**: Ubuntu Server 22.04 LTS - Gen2
   - **VM architecture**: x64
   - **Size**: Standard_B2s (2 vCPUs, 4 GB RAM) - minimum recommended
     - For production with moderate traffic: Standard_B4ms (4 vCPUs, 16 GB RAM)
     - For high traffic: Standard_D4s_v5 or higher

3. **Configure Administrator Account**:
   - **Authentication type**: SSH public key
   - **Username**: `azureuser`
   - **SSH public key source**: Generate new key pair
   - **Key pair name**: `hydraa-vm-key`

4. **Configure Networking**:
   - **Virtual network**: Create new or select existing
   - **Subnet**: default
   - **Public IP**: Create new
   - **NIC network security group**: Advanced
   - **Configure network security group**:
     - Add inbound security rules:
       - SSH (port 22) - Source: Your IP address only
       - HTTP (port 80) - Source: Any
       - HTTPS (port 443) - Source: Any

5. **Configure Management**:
   - **Boot diagnostics**: Disable (optional)
   - **Identity**: System assigned managed identity (optional, for advanced scenarios)

6. **Review and Create**:
   - Review configuration
   - Click "Create"
   - Download the private key (.pem file) when prompted

### Option B: Azure CLI

```bash
# Install Azure CLI if not already installed
# Windows: winget install Microsoft.AzureCLI
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Create resource group
az group create --name hydraa-rg --location eastus

# Create VM with SSH key authentication
az vm create \
  --resource-group hydraa-rg \
  --name hydraa-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --nsg hydraa-nsg

# Configure NSG rules
az network nsg rule create \
  --resource-group hydraa-rg \
  --nsg-name hydraa-nsg \
  --name AllowHTTP \
  --priority 100 \
  --destination-port-ranges 80 \
  --access Allow \
  --protocol Tcp

az network nsg rule create \
  --resource-group hydraa-rg \
  --nsg-name hydraa-nsg \
  --name AllowHTTPS \
  --priority 101 \
  --destination-port-ranges 443 \
  --access Allow \
  --protocol Tcp

# Get VM public IP
VM_IP=$(az vm show -d -g hydraa-rg -n hydraa-vm --query publicIps -o tsv)
echo "VM Public IP: $VM_IP"
```

## 2. Initial VM Setup and Configuration

### Connect to VM

```bash
# Set correct permissions for private key (if using key-based auth)
chmod 600 ~/Downloads/hydraa-vm-key.pem

# Connect to VM
ssh -i ~/Downloads/hydraa-vm-key.pem azureuser@<VM_PUBLIC_IP>
```

### Update System and Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git htop ufw software-properties-common

# Install Node.js 20.x (as specified in package.json)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PM2 globally for process management
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install nginx
sudo apt install -y nginx

# Install certbot for SSL certificates
sudo apt install -y certbot python3-certbot-nginx

# Install build essentials (for native modules)
sudo apt install -y build-essential

# Clean up
sudo apt autoremove -y
```

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL shell, create database and user
CREATE DATABASE hydraa;
CREATE USER hydraa_user WITH ENCRYPTED PASSWORD 'hydraa_password';
GRANT ALL PRIVILEGES ON DATABASE hydraa TO hydraa_user;
ALTER USER hydraa_user CREATEDB;
\q

# Create database directory for backups
sudo mkdir -p /var/backups/postgresql
sudo chown postgres:postgres /var/backups/postgresql
```

### Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

## 3. Deploy Application Code

### Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/your-repo-name.git hydraa
cd hydraa

# If using private repo, you'll need to configure SSH keys or use HTTPS with token
```

### Install Dependencies

```bash
# Install npm dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### Configure Environment Variables

```bash
# Copy environment example file
cp .env.example .env.production

# Edit production environment file
nano .env.production
```

Update the following variables in `.env.production`:

```bash
# Application
NODE_ENV=production
SECRET=your-super-secure-random-secret-key-here

# URLs
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SITE_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://hydraa_user:your_strong_password_here@localhost:5432/hydraa

# OAuth Providers (configure as needed)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (configure SMTP settings)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# Stripe (if using payments)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other API keys as needed
```

**Security Note**: Generate a strong secret key:
```bash
openssl rand -base64 32
```

### Database Migration

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Seed database (if you have seed script)
npx prisma db seed
```

### Build Application

```bash
# Build the Next.js application
npm run build

# Verify build
ls -la .next/
```

## 4. Configure Process Management with PM2

### Create PM2 Ecosystem File

```bash
# Create ecosystem file for PM2
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [{
    name: 'hydraa',
    script: 'npm',
    args: 'start',
    cwd: '/home/azureuser/hydraa',
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    error_file: '/home/azureuser/hydraa/logs/app-error.log',
    out_file: '/home/azureuser/hydraa/logs/app-out.log',
    log_file: '/home/azureuser/hydraa/logs/app.log',
    time: true,
    watch: false,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
```

### Create Logs Directory

```bash
mkdir -p ~/hydraa/logs
```

### Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u azureuser --hp /home/azureuser

# Check status
pm2 status
pm2 logs hydraa --lines 50
```

## 5. Configure Nginx Reverse Proxy

### Backup Default Configuration

```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
```

### Create Nginx Site Configuration

```bash
sudo nano /etc/nginx/sites-available/hydraa
```

Add the following configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (certbot will add these)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Client max body size for file uploads
    client_max_body_size 100M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Main application proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
        proxy_buffering off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth endpoints rate limiting
    location /api/auth/ {
        limit_req zone=login burst=10 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logging
    access_log /var/log/nginx/hydraa_access.log;
    error_log /var/log/nginx/hydraa_error.log;

    # Block certain file types
    location ~* \.(htaccess|htpasswd|ini|log|sh|sql|conf)$ {
        deny all;
    }

    # Block access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Enable Site Configuration

```bash
# Disable default site
sudo unlink /etc/nginx/sites-enabled/default

# Enable hydraa site
sudo ln -s /etc/nginx/sites-available/hydraa /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## 6. Setup SSL with Let's Encrypt

### Obtain SSL Certificate

```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Configure Auto-Renewal

SSL certificates from Let's Encrypt expire every 90 days. The renewal is automatic, but you can set up monitoring:

```bash
# Check certificate status
sudo certbot certificates

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

## 7. Domain and DNS Configuration

1. **Purchase Domain**: If you don't have one, purchase from Namecheap, GoDaddy, etc.

2. **Configure DNS**:
   - **A Record**: `yourdomain.com` → `<VM_PUBLIC_IP>`
   - **CNAME Record**: `www.yourdomain.com` → `yourdomain.com`

3. **Wait for Propagation**: DNS changes can take up to 24-48 hours to propagate globally.

4. **Verify Domain**: Once DNS is propagated, run certbot again if needed.

## 8. Security Hardening

### SSH Hardening

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Make these changes:
# Port 22  # Change to non-standard port (optional)
# PermitRootLogin no
# PasswordAuthentication no  # If using key-based auth only
# AllowUsers azureuser

# Restart SSH
sudo systemctl restart sshd
```

### Fail2Ban Installation (Optional)

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure for SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Enable SSH jail
# [sshd]
# enabled = true

# Restart fail2ban
sudo systemctl restart fail2ban
```

### File Permissions

```bash
# Secure environment file
chmod 600 ~/hydraa/.env.production

# Secure SSH keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

## 9. Backup Strategy

### Database Backup Script

```bash
# Create backup script
nano ~/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="hydraa"
DB_USER="hydraa_user"

# Create database backup
sudo -u postgres pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/db_backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x ~/backup.sh

# Test backup
./backup.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /home/azureuser/backup.sh
```

### Application Backup

```bash
# Create application backup script
nano ~/backup-app.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/azureuser/backups"
APP_DIR="/home/azureuser/hydraa"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules and .next)
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
  --exclude="$APP_DIR/node_modules" \
  --exclude="$APP_DIR/.next" \
  --exclude="$APP_DIR/logs" \
  $APP_DIR

echo "Application backup completed: app_backup_$DATE.tar.gz"
```

## 10. Monitoring and Maintenance

### Application Monitoring

```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs hydraa
pm2 logs hydraa --lines 100

# Monitor resources
htop
df -h
free -h
```

### Nginx Monitoring

```bash
# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/hydraa_access.log
sudo tail -f /var/log/nginx/hydraa_error.log
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y iotop sysstat

# Check system logs
sudo journalctl -u pm2-azureuser -f
sudo journalctl -u nginx -f
```

### Log Rotation

```bash
# Configure log rotation for application logs
sudo nano /etc/logrotate.d/hydraa
```

```
/home/azureuser/hydraa/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 azureuser azureuser
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 11. Update and Deployment Process

### Application Updates

```bash
# Navigate to application directory
cd ~/hydraa

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Generate Prisma client (if schema changed)
npx prisma generate

# Run migrations (if any)
npx prisma migrate deploy

# Build application
npm run build

# Restart application
pm2 restart hydraa

# Check status
pm2 status
curl -I http://localhost:3000
```

### Zero-Downtime Deployment (Advanced)

For zero-downtime deployments, you can use PM2's cluster mode:

```javascript
// Update ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hydraa',
    script: 'npm',
    args: 'start',
    cwd: '/home/azureuser/hydraa',
    instances: 2,  // Number of instances
    exec_mode: 'cluster',  // Cluster mode
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // ... other config
  }]
};
```

Then reload with:
```bash
pm2 reload ecosystem.config.js
```

## 12. Troubleshooting

### Common Issues

**Application not starting:**
```bash
pm2 logs hydraa
pm2 restart hydraa
```

**Database connection issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U hydraa_user -d hydraa
```

**nginx configuration errors:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

**Port already in use:**
```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo netstat -tulpn | grep :3000
```

**Memory issues:**
```bash
free -h
pm2 monit
```

### Performance Optimization

**PM2 Configuration Tuning:**
```javascript
// ecosystem.config.js optimizations
module.exports = {
  apps: [{
    // ... existing config
    max_memory_restart: '800M',
    node_args: '--max-old-space-size=4096',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster'
  }]
};
```

**Nginx Optimizations:**
```nginx
# Add to nginx config
worker_processes auto;
worker_connections 1024;
```

**PostgreSQL Tuning:**
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Adjust settings based on your VM size:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# work_mem = 4MB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 13. Cost Optimization

### Azure VM Cost Management

1. **Right-size your VM**: Monitor usage and adjust VM size as needed
2. **Use Reserved Instances**: For long-term deployments
3. **Auto-shutdown**: Configure auto-shutdown during off-hours
4. **Monitor costs**: Use Azure Cost Management

### Database Optimization

1. **Connection pooling**: Consider using PgBouncer
2. **Query optimization**: Monitor slow queries
3. **Index optimization**: Regularly review and optimize indexes

## 14. Scaling Considerations

### Vertical Scaling
- Increase VM size through Azure Portal
- Adjust PostgreSQL memory settings
- Update PM2 configuration for more instances

### Horizontal Scaling (Advanced)
- Load balancer setup
- Database read replicas
- Redis for session storage
- CDN for static assets

## Summary

This guide covers the complete deployment process from VM creation to production deployment. Key components include:

- Azure VM setup with proper security
- Node.js and PostgreSQL installation
- Application deployment with PM2
- Nginx reverse proxy configuration
- SSL certificate setup
- Security hardening
- Backup and monitoring strategies
- Troubleshooting and optimization tips

For production environments, consider implementing additional monitoring, automated testing, and disaster recovery procedures.</content>
<parameter name="filePath">c:\Users\Jayakumar\Documents\hydraa\hydraa\hydranew\hydraa\AZURE_VM_DEPLOYMENT_GUIDE.md