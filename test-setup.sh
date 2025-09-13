#!/bin/bash

# Test setup script for SaaS application
# This script sets up a dedicated test database and runs tests

set -e

echo "🚀 Setting up test environment..."

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Start test database
print_status "Starting test database..."
docker-compose --profile test up -d postgres-test

# Wait for database to be ready
print_status "Waiting for test database to be ready..."
sleep 10

# Check if database is ready
if ! docker-compose --profile test exec -T postgres-test pg_isready -U user -d saas_app_test > /dev/null 2>&1; then
    print_error "Test database is not ready"
    exit 1
fi

print_success "Test database is ready"

# Initialize test database schema
print_status "Initializing test database schema..."
cd frontend && npm run test:setup

print_success "Test database initialized"

# Run tests
print_status "Running e2e tests..."
npm run test:e2e

# Cleanup
print_status "Cleaning up test environment..."
npm run test:cleanup
docker-compose --profile test down

print_success "Test environment cleaned up"
print_success "All tests completed successfully!"