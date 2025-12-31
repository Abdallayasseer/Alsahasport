#!/bin/bash

echo "🚀 Testing /api/admin/codes endpoint"
echo ""

# Step 1: Login
echo "🔐 Step 1: Logging in as admin..."

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"master_admin","password":"master123"}')

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo "✅ Login successful!"
    
    # Extract access token  (works with both jq and without)
    if command -v jq &> /dev/null; then
        ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
    else
        # Fallback: extract token using grep and sed
        ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"\(.*\)"/\1/')
    fi
    
    echo "   Token: ${ACCESS_TOKEN:0:20}..."
    echo ""
    
    # Step 2: Fetch codes
    echo "📋 Step 2: Fetching codes..."
    
    CODES_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X GET http://localhost:5000/api/admin/codes \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json")
    
    # Extract HTTP status
    HTTP_STATUS=$(echo "$CODES_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$CODES_RESPONSE" | sed '/HTTP_STATUS/d')
    
    echo "   Status: $HTTP_STATUS"
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Codes retrieved successfully!"
        echo ""
        echo "📊 Response:"
        echo "$RESPONSE_BODY" | (command -v jq &> /dev/null && jq '.' || cat)
    else
        echo "❌ Failed to fetch codes!"
        echo "   Response:"
        echo "$RESPONSE_BODY"
    fi
    
else
    echo "❌ Login failed!"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi
