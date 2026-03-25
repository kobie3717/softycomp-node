#!/bin/bash

# Start SoftyComp Developer Playground

echo "Starting SoftyComp Developer Playground..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start with PM2
pm2 start server.js --name softycomp-playground
pm2 save

echo ""
echo "✓ SoftyComp Playground is running!"
echo ""
echo "  Local:    http://localhost:4021"
echo "  External: http://45.10.161.148:4021"
echo ""
echo "View logs:  pm2 logs softycomp-playground"
echo "Stop:       pm2 stop softycomp-playground"
echo ""
