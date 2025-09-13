#!/bin/bash

# Stop test environment
# This script stops the test database and test backend

set -e

echo "🛑 Stopping test environment..."

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

# Stop test services
print_status "Stopping test database and backend..."
docker-compose --profile test down

# Clean up test database data
print_status "Cleaning up test database data..."
cd frontend && npm run test:cleanup 2>/dev/null || print_warning "Could not clean test database (might already be stopped)"

print_success "Test environment stopped successfully!"