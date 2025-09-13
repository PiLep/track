#!/bin/bash

# Start complete test environment
# This script starts the test database and test backend for testing

set -e

echo "🚀 Starting test environment..."

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

# Stop any existing test services
print_status "Stopping existing test services..."
docker-compose --profile test down 2>/dev/null || true

# Start test database, backend, and test frontend
print_status "Starting test database, backend, and test frontend..."
docker-compose --profile test up -d postgres-test backend-test frontend-test

# Wait for services to be ready
print_status "Waiting for test database..."
sleep 15

# Check if database is ready
if ! docker-compose --profile test exec -T postgres-test pg_isready -U user -d saas_app_test > /dev/null 2>&1; then
    print_error "Test database is not ready"
    exit 1
fi

print_success "Test database is ready"

# Check if backend is ready
print_status "Waiting for test backend..."
sleep 5

# Test backend health
if curl -s http://localhost:3002/api/auth/me -H "Authorization: Bearer test" > /dev/null 2>&1; then
    print_success "Test backend is ready"
else
    print_warning "Test backend might not be fully ready yet"
fi

# Check if frontend is ready
print_status "Waiting for test frontend..."
sleep 10

# Test frontend health
if curl -s http://localhost:5174 > /dev/null 2>&1; then
    print_success "Test frontend is ready"
else
    print_warning "Test frontend might not be fully ready yet"
fi

# Initialize test database
print_status "Initializing test database..."
cd frontend && npm run test:setup

print_success "Test environment is ready!"
print_status "Test database: postgresql://user:password@localhost:5433/saas_app_test"
print_status "Test backend: http://localhost:3002"
print_status "Test frontend: http://localhost:5174"
echo ""
print_status "Run tests with: cd frontend && npm run test:e2e"
print_status "Stop test environment with: docker-compose --profile test down"