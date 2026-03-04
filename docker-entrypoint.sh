#!/bin/bash
set -e

# Wait for frontend to be healthy
echo "Waiting for frontend to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "Frontend is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "Attempt $attempt/$max_attempts..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "Frontend failed to become ready after ${max_attempts} attempts"
  exit 1
fi

# Open browser if possible
echo "Opening browser to http://localhost:5173"
if command -v xdg-open > /dev/null; then
  # Linux
  xdg-open "http://localhost:5173"
elif command -v open > /dev/null; then
  # macOS
  open "http://localhost:5173"
elif command -v start > /dev/null; then
  # Windows
  start "http://localhost:5173"
else
  echo "Could not open browser automatically. Visit http://localhost:5173 manually"
fi

echo "Application is ready!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3001"
echo "Database: postgres://localhost:5432/one_sentence_reviews"

# Keep the script running
tail -f /dev/null
