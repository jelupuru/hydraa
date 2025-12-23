# Azure VM Deployment Guide with nginx

Complete guide to deploy your dockerized Next.js app to Azure VM with nginx reverse proxy.

## 1. Create Azure VM

### Azure Portal Steps:
1. **Create VM Resource**:
   - Go to Azure Portal → Virtual machines → Create
   - **Image**: Ubuntu Server 22.04 LTS
   - **Size**: Standard B2s (2 vcpus, 4 GB RAM) minimum
   - **Authentication**: SSH public key
   - **Inbound ports**: Allow SSH (22), HTTP (80), HTTPS (443)

2. **Networking Configuration**:
   - Create new Virtual Network or use existing
   - Assign public IP
   - Configure Network Security Group rules:
     - SSH (22) - Your IP only
     - HTTP (80) - Any source
     - HTTPS (443) - Any source
     - Custom port 3000 (for direct app access during setup)

### Azure CLI Alternative:
```bash
# Create resource group
az group create --name hydraa-rg --location eastus

# Create VM
az vm create \
  --resource-group hydraa-rg \
  --name hydraa-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --open-port 22,80,443,3000

# Get VM public IP
az vm show -d -g hydraa-rg -n hydraa-vm --query publicIps -o tsv
```

## 2. Initial VM Setup

### Connect to VM:
```bash
ssh azureuser@<VM_PUBLIC_IP>
```

### Update system and install dependencies:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker azureuser

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install nginx
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Logout and login again for docker group to take effect
exit
ssh azureuser@<VM_PUBLIC_IP>
```

## 3. Deploy Application

### Clone or upload your project:
```bash
# Option A: Clone from git
git clone <your-repo-url> hydraa
cd hydraa

# Option B: Upload files using scp from local machine
# scp -r . azureuser@<VM_PUBLIC_IP>:~/hydraa
```

### Create production environment file:
```bash
cd ~/hydraa
cp .env .env.production

# Edit production environment variables
nano .env.production
```

Update these values in `.env.production`:
```bash
SECRET=<generate-strong-secret>
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SITE_URL=https://yourdomain.com
DATABASE_URL=postgresql://hydraa:hydraa_pass@db:5432/hydraa_db
NODE_ENV=production
```

### Build and start the application:
```bash
# Pull the latest image or build locally
docker compose -f docker-compose.yml --env-file .env.production up -d

# Or build locally if needed
docker compose -f docker-compose.yml --env-file .env.production up --build -d

# Run initial migration
docker compose -f docker-compose.yml run --rm app npx prisma migrate deploy

# Check if services are running
docker compose ps
```

## 4. Configure nginx Reverse Proxy

### Backup default nginx config:
```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
```

### Create nginx site configuration:
```bash
sudo nano /etc/nginx/sites-available/hydraa
```

Add the nginx configuration (see nginx config file).

### Enable the site:
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

## 5. Setup SSL with Let's Encrypt

### Get SSL certificate:
```bash
# Replace yourdomain.com with your actual domain
sudo certbot --nginx -d yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## 6. Setup Automatic Startup

### Create systemd service:
```bash
sudo nano /etc/systemd/system/hydraa.service
```

Add the systemd service configuration (see service file).

### Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable hydraa.service
sudo systemctl start hydraa.service

# Check status
sudo systemctl status hydraa.service
```

## 7. Security Hardening

### Configure UFW Firewall:
```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

### Setup log rotation:
```bash
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
        docker compose -f /home/azureuser/hydraa/docker-compose.yml restart app
    endscript
}
```

## 8. Monitoring and Maintenance

### Check application logs:
```bash
# View application logs
docker compose logs -f app

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check system resource usage
htop
docker stats
```

### Update application:
```bash
cd ~/hydraa

# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose up --build -d

# Run any new migrations
docker compose run --rm app npx prisma migrate deploy
```

## 9. Backup Strategy

### Database backup script:
```bash
mkdir -p ~/backups
nano ~/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/azureuser/backups"

# Create database backup
docker compose -f /home/azureuser/hydraa/docker-compose.yml exec -T db pg_dump -U hydraa hydraa_db > "$BACKUP_DIR/db_backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql"
```

```bash
chmod +x ~/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/azureuser/backup.sh
```

## 10. Domain and DNS Setup

1. **Purchase domain** from registrar (Namecheap, GoDaddy, etc.)
2. **Configure DNS**:
   - Create A record: `yourdomain.com` → VM Public IP
   - Create CNAME record: `www.yourdomain.com` → `yourdomain.com`
3. **Wait for DNS propagation** (up to 24 hours)
4. **Run certbot again** once domain is pointing to your VM

## Troubleshooting

### Common issues and solutions:

**Application not starting:**
```bash
docker compose logs app
sudo systemctl status hydraa.service
```

**nginx configuration errors:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

**Database connection issues:**
```bash
docker compose exec db psql -U hydraa -d hydraa_db -c '\l'
```

**Port already in use:**
```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo systemctl stop apache2  # if apache is running
```