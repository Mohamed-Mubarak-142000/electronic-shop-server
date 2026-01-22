#!/bin/bash

# Deployment Verification Script
# Tests MongoDB connection and critical API endpoints

# Set BASE_URL (defaults to local, can be overridden with env var)
BASE_URL="${API_BASE_URL:-http://localhost:5000}"
echo "=========================================="
echo "Testing API at $BASE_URL"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local headers=$4
    
    echo "Testing: $name"
    
    if [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "$headers" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        echo "Response: ${body:0:200}..."
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        ((FAILED++))
    fi
    echo ""
}

# 0. Health Check
echo -e "${YELLOW}=== Health Check ===${NC}"
test_endpoint "Health Check" "$BASE_URL/api/health"

# 1. MongoDB Connection Test
echo -e "${YELLOW}=== MongoDB Connection ===${NC}"
test_endpoint "Root Endpoint" "$BASE_URL/"

# 2. Brands Test (The failing endpoint from error logs)
echo -e "${YELLOW}=== Critical Endpoints ===${NC}"
test_endpoint "Get Brands" "$BASE_URL/api/brands"

# 3. Categories Test
test_endpoint "Get Categories" "$BASE_URL/api/categories"

# 4. Products Test
test_endpoint "Get Products" "$BASE_URL/api/products"

# 5. Config Test
test_endpoint "Get Configs" "$BASE_URL/api/config"

# Summary
echo ""
echo "=========================================="
echo -e "Test Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "=========================================="

if [ $FAILED -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Troubleshooting Tips:${NC}"
    echo "1. Verify MONGO_URI is set in Vercel Environment Variables"
    echo "2. Ensure MongoDB Atlas allows IP 0.0.0.0/0 (or Vercel IPs)"
    echo "3. Check Vercel deployment logs for connection errors"
    echo "4. Test locally: npm start"
    exit 1
fi

exit 0
