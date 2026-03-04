#!/bin/bash

# Wrapper script to run docker-start.sh with docker group access
# This is needed because the shell session may not have docker group permissions

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$PROJECT_DIR/docker-start.sh"

# Run the actual startup script with docker group access
sg docker "$SCRIPT"
