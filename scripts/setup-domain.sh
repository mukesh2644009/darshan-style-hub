#!/bin/bash

# Darshan Cloth Shop - Local Domain Setup Script
# This script sets up www.darshanclothsjaipur.com to work locally

echo "🌐 Setting up local domain alias..."
echo ""

# Check if already exists
if grep -q "darshanclothsjaipur.com" /etc/hosts; then
    echo "✅ Domain already configured in /etc/hosts"
else
    echo "Adding domain to /etc/hosts (requires sudo password)..."
    echo "" | sudo tee -a /etc/hosts > /dev/null
    echo "# Darshan Cloth Shop Local Development" | sudo tee -a /etc/hosts > /dev/null
    echo "127.0.0.1    www.darshanclothsjaipur.com" | sudo tee -a /etc/hosts > /dev/null
    echo "127.0.0.1    darshanclothsjaipur.com" | sudo tee -a /etc/hosts > /dev/null
    echo "✅ Domain added to /etc/hosts"
fi

# Flush DNS cache
echo "Flushing DNS cache..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder 2>/dev/null

echo ""
echo "🎉 Setup complete!"
echo ""
echo "You can now access your shop at:"
echo "  → http://www.darshanclothsjaipur.com:3000"
echo "  → http://darshanclothsjaipur.com:3000"
echo ""
echo "Make sure your dev server is running: npm run dev"

