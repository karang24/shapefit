#!/bin/bash

echo "========================================="
echo "ShapeFit Docker Setup"
echo "========================================="
echo

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi
echo "[OK] Docker is running"
echo

# Build and start services
echo "Building and starting Docker services..."
docker-compose up --build
echo

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo
echo "Services available:"
echo "  - Backend API:     http://localhost:8000"
echo "  - API Docs:         http://localhost:8000/docs"
echo "  - Database UI:       http://localhost:8080"
echo "  - Coach QR Code:    http://localhost:8000/api/coach-qr"
echo
echo "To access QR code directly:"
echo "  docker cp shapefit_backend:/app/coach_qr/coach_qr.png ./coach_qr.png"
echo
echo "To stop all services:"
echo "  docker-compose down"
echo
echo "To view logs:"
echo "  docker-compose logs -f"
echo
