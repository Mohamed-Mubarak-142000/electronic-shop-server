#!/bin/bash
BASE_URL="http://localhost:5000/api"
echo "Testing API at $BASE_URL"

# 1. Register
echo "1. Registering User..."
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"testuser@example.com","password":"password123"}' > register.json
cat register.json
echo ""

# 2. Login
echo "2. Logging in..."
curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}' > login.json
cat login.json
echo ""

# Extract Token (simple grep/cut, assumes JSON structure {"...":..., "token":"..."})
TOKEN=$(cat login.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed or token not found. Trying to login again assuming user exists..."
  # Just to be safe if register failed because user exists
fi

echo "Token extracted: ${TOKEN:0:10}..."

# 3. Get Profile
echo "3. Get Profile..."
curl -s -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $TOKEN" > profile.json
cat profile.json
echo ""

# 4. Get Products
echo "4. Get Products..."
curl -s -X GET $BASE_URL/products > products.json
# Show first 500 chars
head -c 500 products.json 
echo "..."
echo ""

# 5. Get Categories
echo "5. Get Categories..."
curl -s -X GET $BASE_URL/categories > categories.json
cat categories.json
echo ""

# 6. Get Brands
echo "6. Get Brands..."
curl -s -X GET $BASE_URL/brands > brands.json
cat brands.json
echo ""
