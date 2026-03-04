#!/bin/bash

# Docker startup script for One Sentence Reviews
# This script handles Docker Compose startup with proper error handling

set -e

echo "=========================================="
echo "One Sentence Reviews - Docker Startup"
echo "=========================================="
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi

# Check if Docker daemon is running
echo "Checking Docker daemon..."
if ! docker ps &> /dev/null; then
    echo "ERROR: Docker daemon is not running"
    exit 1
fi

echo "✓ Docker is available"
echo ""

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    exit 1
fi

echo "✓ Docker Compose is available"
echo ""

# Navigate to project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "Starting Docker Compose from: $PROJECT_DIR"
echo ""

# Pull images first
echo "Pulling Docker images..."
docker-compose pull || {
    echo "WARNING: Could not pull all images (may be offline)"
    echo "Attempting to build with cached layers..."
}

echo ""
echo "Building services..."
docker-compose build --no-cache || {
    echo "ERROR: Failed to build Docker services"
    exit 1
}

echo ""
echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."

# Wait for database
echo -n "Waiting for database..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo ""
    echo "ERROR: Database failed to start"
    docker-compose logs db
    exit 1
fi

# Wait for backend
echo -n "Waiting for backend API..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo ""
    echo "ERROR: Backend API failed to start"
    docker-compose logs backend
    exit 1
fi

# Wait for frontend
echo -n "Waiting for frontend..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo ""
    echo "ERROR: Frontend failed to start"
    docker-compose logs frontend
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ All services started successfully!"
echo "=========================================="
echo ""
echo "Application is ready at:"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3001"
echo "  Database:  postgres://localhost:5432/one_sentence_reviews"
echo ""
echo "Login credentials:"
echo "  Username: alice"
echo "  Password: password123"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""

# Attempt to open browser
if command -v xdg-open &> /dev/null; then
    echo "Opening browser..."
    xdg-open "http://localhost:5173"
elif command -v open &> /dev/null; then
    echo "Opening browser..."
    open "http://localhost:5173"
fi

echo ""
