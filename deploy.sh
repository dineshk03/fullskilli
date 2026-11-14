#!/bin/bash

# 🚀 LMS Production Deployment Script
# Run this script on your server (180.179.58.244)

echo "🚀 Starting LMS Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for security."
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js installed successfully"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 already installed: $(pm2 --version)"
fi

# Install MongoDB if not installed
if ! command -v mongod &> /dev/null; then
    print_status "Installing MongoDB..."
    sudo apt install -y mongodb
    sudo systemctl start mongodb
    sudo systemctl enable mongodb
    print_success "MongoDB installed and started"
else
    print_success "MongoDB already installed"
fi

# Navigate to project directory
PROJECT_DIR="/home/$(whoami)/lms.skilli.jobs"
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    print_status "Please upload your project files to $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Deploy Backend
print_status "Deploying Backend..."
cd backend/

# Install backend dependencies
print_status "Installing backend dependencies..."
npm install --production

# Stop existing backend process
pm2 delete lms-backend 2>/dev/null || true

# Start backend with PM2
print_status "Starting backend with PM2..."
pm2 start server.js --name "lms-backend" --env production

# Deploy Frontend
print_status "Deploying Frontend..."
cd ../frontend/

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install

# Build frontend for production
print_status "Building frontend for production..."
npm run build

# Install serve if not installed
if ! command -v serve &> /dev/null; then
    print_status "Installing serve..."
    sudo npm install -g serve
fi

# Stop existing frontend process
pm2 delete lms-frontend 2>/dev/null || true

# Start frontend with PM2
print_status "Starting frontend with PM2..."
pm2 start "serve -s dist -l 3000" --name "lms-frontend"

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save
pm2 startup

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Frontend
sudo ufw allow 5001  # Backend API
sudo ufw --force enable

# Check services
print_status "Checking services..."
sleep 5

# Check if services are running
if pm2 list | grep -q "lms-backend.*online"; then
    print_success "Backend is running successfully"
else
    print_error "Backend failed to start"
fi

if pm2 list | grep -q "lms-frontend.*online"; then
    print_success "Frontend is running successfully"
else
    print_error "Frontend failed to start"
fi

# Display status
print_status "Deployment Summary:"
echo "=================================="
pm2 status
echo "=================================="

print_success "🎉 Deployment completed!"
echo ""
print_status "Access your application:"
echo "  📱 Frontend: http://180.179.58.244:3000"
echo "  🔧 Admin Panel: http://180.179.58.244:3000/admin"
echo "  🚀 Backend API: http://180.179.58.244:5001"
echo "  📧 Email Reports: http://180.179.58.244:3000/admin"
echo ""
print_status "Useful commands:"
echo "  📊 Monitor: pm2 monit"
echo "  📝 Logs: pm2 logs"
echo "  🔄 Restart: pm2 restart all"
echo "  ⏹️  Stop: pm2 stop all"
echo ""
print_warning "Remember to:"
echo "  - Test all features thoroughly"
echo "  - Set up regular backups"
echo "  - Monitor system resources"
echo "  - Keep security updates current"
