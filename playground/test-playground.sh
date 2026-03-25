#!/bin/bash

# SoftyComp Playground - Verification Script

echo "================================================"
echo "  SoftyComp Playground - System Check"
echo "================================================"
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if pm2 list | grep -q "softycomp-playground.*online"; then
    echo "   ✅ Server is running"
else
    echo "   ❌ Server is NOT running"
    echo "   Run: pm2 start server.js --name softycomp-playground"
    exit 1
fi
echo ""

# Check if port 4021 is listening
echo "2. Checking if port 4021 is listening..."
if netstat -tuln | grep -q ":4021 "; then
    echo "   ✅ Port 4021 is listening"
else
    echo "   ❌ Port 4021 is NOT listening"
    exit 1
fi
echo ""

# Check if firewall allows port 4021
echo "3. Checking firewall rules..."
if ufw status | grep -q "4021/tcp.*ALLOW"; then
    echo "   ✅ Firewall allows port 4021"
else
    echo "   ⚠️  Port 4021 not in firewall rules"
    echo "   Run: sudo ufw allow 4021/tcp"
fi
echo ""

# Test API status endpoint
echo "4. Testing API status endpoint..."
STATUS=$(curl -s -w "%{http_code}" http://localhost:4021/api/status -o /tmp/api-status.json)
if [ "$STATUS" = "200" ]; then
    echo "   ✅ API status endpoint responding"
    AUTH_STATUS=$(jq -r '.authenticated' /tmp/api-status.json)
    if [ "$AUTH_STATUS" = "true" ]; then
        echo "   ✅ SoftyComp authentication successful"
    else
        echo "   ❌ SoftyComp authentication failed"
    fi
else
    echo "   ❌ API status endpoint returned $STATUS"
fi
rm -f /tmp/api-status.json
echo ""

# Test static file serving
echo "5. Testing static file serving..."
HTML_STATUS=$(curl -s -w "%{http_code}" http://localhost:4021/ -o /dev/null)
CSS_STATUS=$(curl -s -w "%{http_code}" http://localhost:4021/style.css -o /dev/null)
JS_STATUS=$(curl -s -w "%{http_code}" http://localhost:4021/app.js -o /dev/null)

if [ "$HTML_STATUS" = "200" ]; then
    echo "   ✅ index.html loads correctly"
else
    echo "   ❌ index.html returned $HTML_STATUS"
fi

if [ "$CSS_STATUS" = "200" ]; then
    echo "   ✅ style.css loads correctly"
else
    echo "   ❌ style.css returned $CSS_STATUS"
fi

if [ "$JS_STATUS" = "200" ]; then
    echo "   ✅ app.js loads correctly"
else
    echo "   ❌ app.js returned $JS_STATUS"
fi
echo ""

# Test bill creation
echo "6. Testing bill creation..."
BILL_RESPONSE=$(curl -s -X POST http://localhost:4021/api/bill \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.00,
    "customerName": "Test User",
    "customerEmail": "test.user@gmail.com",
    "customerPhone": "0825551234",
    "reference": "TEST-'$(date +%s)'",
    "description": "Automated test",
    "frequency": "once-off"
  }')

if echo "$BILL_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    PAYMENT_URL=$(echo "$BILL_RESPONSE" | jq -r '.data.paymentUrl')
    echo "   ✅ Bill created successfully"
    echo "   Payment URL: $PAYMENT_URL"
else
    echo "   ❌ Bill creation failed"
    echo "   Response: $BILL_RESPONSE"
fi
echo ""

# Test webhook endpoint
echo "7. Testing webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:4021/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "TEST-WEBHOOK-'$(date +%s)'",
    "activityTypeID": 2,
    "transactionDate": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "amount": 99.00,
    "paymentMethodTypeID": 1,
    "paymentMethodTypeDescription": "Test Payment",
    "userReference": "TEST-001",
    "information": "Automated test webhook"
  }' -o /dev/null)

if [ "$WEBHOOK_RESPONSE" = "200" ]; then
    echo "   ✅ Webhook endpoint responding"
else
    echo "   ❌ Webhook endpoint returned $WEBHOOK_RESPONSE"
fi
echo ""

# Summary
echo "================================================"
echo "  System Check Complete"
echo "================================================"
echo ""
echo "Access the playground at:"
echo "  • Local:    http://localhost:4021"
echo "  • External: http://45.10.161.148:4021"
echo ""
echo "View logs with:    pm2 logs softycomp-playground"
echo "View process info: pm2 info softycomp-playground"
echo ""
